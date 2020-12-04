# -- coding:UTF-8 --
import requests
from bs4 import BeautifulSoup
import json

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
        c_json = {
            'year': c_data[1].text,
            'semester': c_data[2].text, 
            'courseID': c_data[3].text,
            'department': c_data[4].text,
            'department_level': c_data[5].text[1:-2].replace('\n', '').replace(' ', '').split('\xa0'),
            'compulsory': c_data[6].text[1:-1].replace(' ', '').split('\n'),
            'title': data_title_decode(c_data[7]),
            'teacher': a_tag_list_maker(c_data[8]),
            'category': c_data[9].text,
            'credit': c_data[10].text,
            'hours': c_data[11].text,
            'language': c_data[12].text,
            'course_detail': a_tag_list_maker(c_data[13]),
            'sign': c_data[14].text,
            'sign_people': c_data[15].text,
            'max_people': c_data[16].text,
            'url': 'https://sea.cc.ntpu.edu.tw/pls/dev_stud/course_query.queryGuide?g_serial=' + c_data[3].text + '&g_year=' + c_data[1].text + '&g_term=' + c_data[2].text + '&show_info=part'
        }
        course_json_list.append(c_json)

    return course_json_list

all_course_list = []

for i in range(1, 8):
    print('Write week %d' % i)
    temp_list = get_course(109, 1, i)
    for temp in temp_list:
        all_course_list.append(temp)

with open('all_course_list_week.txt', 'w', newline='', encoding='utf-8') as outfile:
    json.dump(all_course_list, outfile, ensure_ascii=False, indent = 4)