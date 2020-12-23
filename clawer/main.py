# -- coding:UTF-8 --
import requests
from bs4 import BeautifulSoup
import json
import time

def all_num_check(inputtext):
    for i in range(len(inputtext)):
        if ord(inputtext[i]) >= 48 and ord(inputtext[i]) <= 57:
            continue
        else:
            return False
    return True

def department_level_decode(data):
    output = []

    data = data[1:-1].split('\n')
    for info in data:
        info = info.replace(' ', '').replace('\xa0', '')
        single_data = {
            'grade': 'N/A',
            'class': 'N/A',
            'category': 'N/A',
            'original': info,
        }
        if info.find('微學程') > -1:
            single_data['category'] = '微學程'
        elif info.find('學分學程') > -1:
            single_data['category'] = '學分學程'
        elif info.find('通識') > -1:
            single_data['category'] = '通識'
        elif info.find('向度') > -1:
            single_data['category'] = '通識'
        else:
            for i in range(1,6):
                flag = info.find(str(i))
                if flag > -1:
                    single_data['grade'] = info[flag]
                    single_data['class'] = info[flag+1:]
                    single_data['category'] = info[:flag]
        output.append(single_data)
    return output

def a_tag_list_maker(data):
    output = []
    c_list = data.find_all('a')
    for teacher in c_list:
        output.append(teacher.text)
    return output

def data_title_decode(data):
    find_ch = data.find_all('a')
    ch = find_ch[0].text
    if len(find_ch) == 1:
        limit = False
    else:
        limit = True
    other = data.find('font').text[3:]
    en = data.get_text().split('備註')[0].replace(ch, '')
    return {
        'ch': ch.replace('\xa0', ''),
        'en': en,
        'limit': limit,
        'other': other,
    }

def course_info_decode(data):
    output = []
    for info in data:
        single_data = {
            'courseTime': 'N/A',
            'time_category': 'N/A',
            'sessions': 'N/A',
            'place': 'N/A',
            'original': info,
        }
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

        if info.find('週一') > -1:
            single_data['courseTime'] = 1
        elif info.find('週二') > -1:
            single_data['courseTime'] = 2
        elif info.find('週三') > -1:
            single_data['courseTime'] = 3
        elif info.find('週四') > -1:
            single_data['courseTime'] = 4
        elif info.find('週五') > -1:
            single_data['courseTime'] = 5
        elif info.find('週六') > -1:
            single_data['courseTime'] = 6
        elif info.find('週日') > -1:
            single_data['courseTime'] = 7

        find_sessions = info.find('~')
        if find_sessions > -1:
            sessions_list = []
            if all_num_check(info[find_sessions-2]):
                f = int(info[find_sessions-2])*10 + int(info[find_sessions-1])
                b = int(info[find_sessions+1])*10 + int(info[find_sessions+2])
            elif all_num_check(info[find_sessions+2]):
                f = int(info[find_sessions-1])
                b = int(info[find_sessions+1])*10 + int(info[find_sessions+2])
            else:
                f = int(info[find_sessions-1])
                b = int(info[find_sessions+1])

            for i in range(f ,b+1):
                sessions_list.append(i)
            single_data['sessions'] = sessions_list
        
        find_place = info.find('\t')
        if find_place > -1:
            single_data['place'] = info[find_place+1:]

        output.append(single_data)
    
    return output

def get_course(year, semester, week):
    course_json_list = []
    url = 'https://sea.cc.ntpu.edu.tw/pls/dev_stud/course_query_all.queryByAllConditions'
    data = 'qYear=' + str(year) + '&qTerm=' + str(semester) + '&week=' + str(week) + '&seq1=A&seq2=M'
    r = requests.get(url, data)
    sp = BeautifulSoup(r.text, 'lxml')

    table = sp.find('table').find('tbody')
    course_list = table.find_all('tr')
    print('Found %d data.' % len(course_list))

    for course in course_list:
        c_data = course.find_all('td')
        # print({c_data[5].text})
        c_json = {
            'year': c_data[1].text,
            'semester': c_data[2].text, 
            'courseID': c_data[3].text,
            'department': c_data[4].text,
            'department_level': department_level_decode(c_data[5].text),
            'compulsory': c_data[6].text[1:-1].replace(' ', '').split('\n'),
            'title': data_title_decode(c_data[7]),
            'teacher': a_tag_list_maker(c_data[8]),
            'category': c_data[9].text,
            'credit': c_data[10].text,
            'hours': c_data[11].text,
            'language': c_data[12].text,
            'course_detail': course_info_decode(a_tag_list_maker(c_data[13])),
            'sign': c_data[14].text,
            'sign_people': c_data[15].text,
            'max_people': c_data[16].text,
        }
        course_json_list.append(c_json)

    return course_json_list

start_time = str(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
all_course_list = []
fliter_item = []

print('Read Config...')
with open('../config.json') as config_file:
    config_data = json.load(config_file)
    print('Config: ' + str(config_data))

for i in range(1, 8):
    print('Read week - %d' % i)
    temp_list = get_course(config_data['year'], config_data['semester'], i)
    for temp in temp_list:
        all_course_list.append(temp)

for course in all_course_list:
    for department in course['department_level']:
        if department['original'] not in fliter_item:
            fliter_item.append(department['original'])

fliter_item.sort()

end_time = str(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

output = {
    'start_time': start_time,
    'end_time': end_time,
    'data': all_course_list,
    'fliter_item': fliter_item,
}

with open('all_course_list.json', 'w', newline='', encoding='utf-8') as outfile:
    json.dump(output, outfile, ensure_ascii=False, indent = 4)

with open(str(config_data['year']) + str(config_data['semester']) + 'all_course_list.json', 'w', newline='', encoding='utf-8') as outfile:
    json.dump(output, outfile, ensure_ascii=False, indent = 4)
