# -- coding:UTF-8 --
import requests
from bs4 import BeautifulSoup
import json
import time
import logging
import os
from pathlib import Path
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('clawer/crawler.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def all_num_check(inputtext):
    """Check if all characters in input text are numeric digits."""
    try:
        if not inputtext:
            return False
        for i in range(len(inputtext)):
            if ord(inputtext[i]) < 48 or ord(inputtext[i]) > 57:
                return False
        return True
    except Exception as e:
        logger.error(f"Error in all_num_check: {e}")
        return False

def department_level_decode(data):
    """Decode department level information from course data."""
    output = []
    try:
        if not data or len(data) < 2:
            logger.warning(f"Invalid department data: {data}")
            return output

        data = data[1:-1].split('\n')
        for info in data:
            info = info.replace(' ', '').replace('\xa0', '')
            if not info:  # Skip empty strings
                continue
                
            single_data = {
                'grade': 'N/A',
                'class': 'N/A',
                'category': 'N/A',
                'original': info,
            }
            
            # Determine category based on keywords
            if info.find('微學程') > -1:
                single_data['category'] = '微學程'
            elif info.find('學分學程') > -1:
                single_data['category'] = '學分學程'
            elif info.find('通識') > -1:
                single_data['category'] = '通識'
            elif info.find('向度') > -1:
                single_data['category'] = '通識'
            else:
                # Parse grade and class information
                for i in range(1, 6):
                    flag = info.find(str(i))
                    if flag > -1:
                        single_data['grade'] = info[flag]
                        single_data['class'] = info[flag+1:]
                        single_data['category'] = info[:flag]
                        break
            
            output.append(single_data)
    except Exception as e:
        logger.error(f"Error in department_level_decode: {e}, data: {data}")
    
    return output

def a_tag_list_maker(data):
    """Extract text from all anchor tags in the given data."""
    output = []
    try:
        if not data:
            return output
        c_list = data.find_all('a')
        for teacher in c_list:
            if teacher.text:
                output.append(teacher.text.strip())
    except Exception as e:
        logger.error(f"Error in a_tag_list_maker: {e}")
    return output

def data_title_decode(data):
    """Decode course title information including Chinese name, English name, and limitations."""
    try:
        find_ch = data.find_all('a')
        if not find_ch:
            logger.warning("No anchor tags found in title data")
            return {'ch': 'N/A', 'en': 'N/A', 'limit': False, 'other': ''}
        
        ch = find_ch[0].text
        limit = len(find_ch) > 1
        
        font_tag = data.find('font')
        other = ''
        if font_tag and len(font_tag.text) > 3:
            other = font_tag.text[3:]
            if other.replace(' ', '') == '':
                other = other.replace(' ', '')
        
        en = data.get_text().split('備註')[0].replace(ch, '').strip()
        
        return {
            'ch': ch.replace('\xa0', ''),
            'en': en,
            'limit': limit,
            'other': other,
        }
    except Exception as e:
        logger.error(f"Error in data_title_decode: {e}")
        return {'ch': 'N/A', 'en': 'N/A', 'limit': False, 'other': ''}

def course_info_decode(data):
    """Decode course time and location information."""
    output = []
    try:
        for info in data:
            if not info:
                continue
                
            single_data = {
                'courseTime': 'N/A',
                'time_category': 'N/A',
                'sessions': 'N/A',
                'place': 'N/A',
                'original': info,
            }
            
            # Parse time category
            if info.find('每週未維護') > -1:
                single_data['courseTime'] = 'N'
                single_data['time_category'] = 'N'
                single_data['sessions'] = 'N'
            elif info.find('每週') > -1:
                single_data['time_category'] = 'A'
            elif info.find('單週') > -1:
                single_data['time_category'] = 'O'
            elif info.find('雙週') > -1:
                single_data['time_category'] = 'E'

            # Parse day of week
            day_mapping = {
                '週一': 1, '週二': 2, '週三': 3, '週四': 4,
                '週五': 5, '週六': 6, '週日': 7
            }
            day_found = False
            for day_str, day_num in day_mapping.items():
                if info.find(day_str) > -1:
                    single_data['courseTime'] = day_num
                    day_found = True
                    break

            # Entries with no day-of-week and no explicit "未維護" marker aren't
            # a time slot at all — they're notes such as a rainy-day backup
            # classroom (e.g. "第二教室313") that the school lists in the same
            # cell as the real time. Skip them instead of storing a fake slot.
            if not day_found and single_data['courseTime'] != 'N':
                logger.info(f"Skipping non-time-slot entry: {info!r}")
                continue

            # Parse session times
            find_sessions = info.find('~')
            if find_sessions > -1:
                try:
                    sessions_list = []
                    # Handle different session time formats
                    if find_sessions >= 2 and find_sessions < len(info) - 2:
                        if all_num_check(info[find_sessions-2]):
                            f = int(info[find_sessions-2]) * 10 + int(info[find_sessions-1])
                            b = int(info[find_sessions+1]) * 10 + int(info[find_sessions+2])
                        elif find_sessions < len(info) - 2 and all_num_check(info[find_sessions+2]):
                            f = int(info[find_sessions-1])
                            b = int(info[find_sessions+1]) * 10 + int(info[find_sessions+2])
                        else:
                            f = int(info[find_sessions-1])
                            b = int(info[find_sessions+1])

                        for i in range(f, b + 1):
                            sessions_list.append(i)
                        single_data['sessions'] = sessions_list
                except (ValueError, IndexError) as e:
                    logger.warning(f"Error parsing session times in '{info}': {e}")
            
            # Parse location
            find_place = info.find('\t')
            if find_place > -1:
                single_data['place'] = info[find_place+1:].strip()

            output.append(single_data)
    except Exception as e:
        logger.error(f"Error in course_info_decode: {e}")
    
    return output

def get_course(year, semester, week):
    """Fetch course data for a specific week from NTPU course system."""
    course_json_list = []
    url = 'http://sea.cc.ntpu.edu.tw/pls/dev_stud/course_query_all.queryByAllConditions'
    data = f'qYear={year}&qTerm={semester}&week={week}&seq1=A&seq2=M'
    
    try:
        logger.info(f"Fetching courses for year {year}, semester {semester}, week {week}")
        response = requests.get(url, data, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        table = soup.find('table')
        if not table:
            logger.error("No table found in response")
            return course_json_list
            
        tbody = table.find('tbody')
        if not tbody:
            logger.error("No tbody found in table")
            return course_json_list
            
        course_list = tbody.find_all('tr')
        logger.info(f'Found {len(course_list)} courses for week {week}')

        for idx, course in enumerate(course_list):
            try:
                c_data = course.find_all('td')
                if len(c_data) < 17:
                    logger.warning(f"Insufficient data in course row {idx}, expected 17 columns, got {len(c_data)}")
                    continue
                    
                c_json = {
                    'year': c_data[1].text.strip(),
                    'semester': c_data[2].text.strip(),
                    'courseID': c_data[3].text.strip(),
                    'department': c_data[4].text.strip(),
                    'department_level': department_level_decode(c_data[5].text),
                    'compulsory': c_data[6].text[1:-1].replace(' ', '').split('\n'),
                    'title': data_title_decode(c_data[7]),
                    'teacher': a_tag_list_maker(c_data[8]),
                    'category': c_data[9].text.strip(),
                    'credit': c_data[10].text.strip(),
                    'hours': c_data[11].text.strip(),
                    'language': c_data[12].text.strip(),
                    'course_detail': course_info_decode(a_tag_list_maker(c_data[13])),
                    'sign': c_data[14].text.strip(),
                    'sign_people': c_data[15].text.strip(),
                    'max_people': c_data[16].text.strip(),
                }
                course_json_list.append(c_json)
            except Exception as e:
                logger.error(f"Error processing course row {idx}: {e}")
                
    except requests.RequestException as e:
        logger.error(f"Network error fetching courses for week {week}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in get_course for week {week}: {e}")

    return course_json_list

def save_json_file(data, filepath):
    """Save data to JSON file with error handling."""
    try:
        # Create directory if it doesn't exist
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', newline='', encoding='utf-8') as outfile:
            json.dump(data, outfile, ensure_ascii=False, indent=4)
        logger.info(f"Successfully saved data to {filepath}")
        return True
    except Exception as e:
        logger.error(f"Failed to save data to {filepath}: {e}")
        return False

def load_config():
    """Load configuration from config.json file."""
    try:
        config_path = Path('config.json')
        if not config_path.exists():
            logger.error("Config file not found: config.json")
            return None
            
        with open(config_path, 'r', encoding='utf-8') as config_file:
            config_data = json.load(config_file)
            logger.info(f"Loaded config: {config_data}")
            
            # Validate config
            if 'year' not in config_data or 'semester' not in config_data:
                logger.error("Invalid config: missing year or semester")
                return None
                
            return config_data
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return None

def main():
    """Main crawler function."""
    logger.info("Starting NTPU course crawler")
    start_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    
    # Load configuration
    config_data = load_config()
    if not config_data:
        logger.error("Failed to load configuration, exiting")
        sys.exit(1)
    
    all_course_list = []
    filter_item = []
    failed_weeks = []
    
    # Fetch course data for all weeks
    for week in range(1, 8):
        logger.info(f"Processing week {week}")
        try:
            temp_list = get_course(config_data['year'], config_data['semester'], week)
            if temp_list:
                all_course_list.extend(temp_list)
                logger.info(f"Successfully processed {len(temp_list)} courses for week {week}")
            else:
                logger.warning(f"No courses found for week {week}")
                failed_weeks.append(week)
        except Exception as e:
            logger.error(f"Failed to process week {week}: {e}")
            failed_weeks.append(week)
    
    if failed_weeks:
        logger.warning(f"Failed to process weeks: {failed_weeks}")
    
    if not all_course_list:
        logger.error("No course data collected, exiting")
        sys.exit(1)
    
    logger.info(f"Total courses collected: {len(all_course_list)}")
    
    # Extract unique department information
    try:
        for course in all_course_list:
            if 'department_level' in course and isinstance(course['department_level'], list):
                for department in course['department_level']:
                    if 'original' in department and department['original'] not in filter_item:
                        filter_item.append(department['original'])
        
        filter_item.sort()
        logger.info(f"Found {len(filter_item)} unique department filters")
    except Exception as e:
        logger.error(f"Error processing department filters: {e}")
    
    end_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    
    # Prepare output data
    output = {
        'start_time': start_time,
        'end_time': end_time,
        'total_courses': len(all_course_list),
        'failed_weeks': failed_weeks,
        'data': all_course_list,
        'fliter_item': filter_item,
    }
    
    # Save output files
    files_to_save = [
        'clawer/all_course_list.json',
        f'clawer/{config_data["year"]}{config_data["semester"]}all_course_list.json'
    ]
    
    success_count = 0
    for filepath in files_to_save:
        if save_json_file(output, filepath):
            success_count += 1
    
    if success_count == len(files_to_save):
        logger.info("All files saved successfully")
        logger.info(f"Crawler completed successfully in {time.strftime('%H:%M:%S', time.gmtime(time.time() - time.mktime(time.strptime(start_time, '%Y-%m-%d %H:%M:%S'))))}")
    else:
        logger.error(f"Only {success_count}/{len(files_to_save)} files saved successfully")
        sys.exit(1)

if __name__ == "__main__":
    main()
