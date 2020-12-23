<template>
  <div class="home">
    <!-- overlay page -->
    <v-overlay :absolute="absolute" :value="overlay">
      <v-card
        class="mx-auto text-left overflow-y-auto"
        outlined
        v-click-outside="onClickOutside"
        :min-height="window_height * 0.7"
        :max-height="window_height * 0.7"
        :min-width="window_width * 0.7"
        :max-width="window_width * 0.7"
      >
        <v-card color="warning" @click="overlay = false">
          <v-icon>mdi-close</v-icon>
        </v-card>
        <v-card-text style="color: white">
          <v-chip>{{ overlay_data.courseID }}</v-chip>
          <v-chip color="green">{{ overlay_data.department }}</v-chip>
          <v-chip
            color="blue"
            v-for="data in overlay_data.department_level"
            :key="data"
          >
            {{ data.original }} ({{
              get_compulsory(overlay_data, data.original)
            }})
          </v-chip>

          <br /><br />
          <h1>{{ overlay_data.title.ch }} | {{ overlay_data.title.en }}</h1>
          <h4>{{ overlay_data.title.other }}</h4>
          <br />
          <h3>時數: {{ overlay_data.hours }}</h3>
          <h3>學分數: {{ overlay_data.credit }}</h3>
          <h3>
            教授:
            <a
              style="color: white"
              v-for="data in overlay_data.teacher"
              :key="data"
            >
              {{ data }}
              <a style="color: white" v-if="overlay_data.teacher.length > 1"
                >,
              </a>
            </a>
          </h3>
          <h3>
            課堂資訊:
            <a
              style="color: white"
              v-for="data in overlay_data.course_detail"
              :key="data"
            >
              {{ data.original }}
              <a
                style="color: white"
                v-if="overlay_data.course_detail.length > 1"
                >,
              </a>
            </a>
          </h3>
          <br />
          <v-btn
            rounded
            color="info"
            :href="
              'https://sea.cc.ntpu.edu.tw/pls/dev_stud/course_query.queryGuide?g_serial=' +
              overlay_data.courseID +
              '&g_year=' +
              overlay_data.year +
              '&g_term=' +
              overlay_data.semester +
              '&show_info=all'
            "
            target="_blank"
          >
            <v-icon left> mdi-launch </v-icon>
            完整資訊
          </v-btn>

          <br /><br />
          <h3>原始資料</h3>
          <json-viewer
            :value="overlay_data"
            :expand-depth="1"
            copyable
          ></json-viewer>
        </v-card-text>
      </v-card>
    </v-overlay>

    <v-row>
      <v-col cols="12" md="3">
        <!-- Search -->
        <v-card class="align-self-center" flat>
          <v-card
            class="pa-2 mx-auto"
            elevation="5"
            align="center"
            justify="center"
            outlined
            tile
            min-width="200px"
            min-height="140px"
          >
            <v-form v-on:submit.prevent="search_course">
              <v-text-field
                v-model="search_input"
                label="課程代碼 / 課程名稱 / 教授 / 開課單位"
              ></v-text-field>
            </v-form>

            <v-combobox
              v-model="fliter_chips"
              :items="fliter_items"
              chips
              clearable
              label="篩選器"
              multiple
              prepend-icon="mdi-filter-variant"
              solo
            >
              <template v-slot:selection="{ attrs, item, select, selected }">
                <v-chip
                  v-bind="attrs"
                  :input-value="selected"
                  close
                  @click="select"
                  @click:close="fliter_remove(item)"
                >
                  <strong>{{ item }}</strong>
                </v-chip>
              </template>
            </v-combobox>

            <v-btn dark depressed @click="search_course"> Search </v-btn>

            <br /><br /><v-divider />
            <!-- <v-chip color="info"> -->
            課程資料時間: {{ course_data.start_time }}
            <!-- </v-chip> -->
            <p>{{ search_result }}</p>
            <v-list style="max-height: 400px" class="overflow-y-auto">
              <v-card
                class="mx-auto text-left"
                outlined
                v-for="data in search_list"
                :key="data"
                :color="data.color"
                @click="
                  if (data.courseID != '0000') {
                    overlay = !overlay;
                  }
                  overlay_courseID = data.courseID;
                  write_overlay();
                "
              >
                <v-list-item three-line>
                  <v-list-item-content>
                    <v-list-item-title class="headline mb-1">
                      {{ data.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ data.department }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle
                      v-for="InData in data.course_detail"
                      :key="InData"
                    >
                      {{ InData.original }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle>
                      {{ data.subtitle }}
                    </v-list-item-subtitle>
                  </v-list-item-content>

                  <v-btn
                    icon
                    large
                    :color="get_status_icon(data.courseID).color"
                    @click="change_course_select_status(data.courseID)"
                  >
                    <v-icon>{{ get_status_icon(data.courseID).icon }}</v-icon>
                  </v-btn>
                </v-list-item>
              </v-card>
            </v-list>
          </v-card>
        </v-card>
        <br />

        <!-- Select Table -->
        <v-card class="align-self-center" flat>
          <v-card
            class="pa-2 mx-auto"
            elevation="5"
            align="center"
            justify="center"
            outlined
            tile
            min-width="200px"
            min-height="140px"
          >
            <h2>已選課程</h2>
            <h3>學分 / 時數: {{ show_credit }} / {{ show_hours }}</h3>
            <v-divider />
            <v-list style="max-height: 500px" class="overflow-y-auto">
              <v-card
                class="mx-auto text-left"
                outlined
                v-for="data in select_list"
                :key="data"
                @click="
                  overlay = !overlay;
                  overlay_courseID = data.courseID;
                  write_overlay();
                "
              >
                <v-list-item three-line>
                  <v-list-item-content>
                    <v-list-item-title class="headline mb-1">
                      {{ data.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ data.department }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle
                      v-for="InData in data.course_detail"
                      :key="InData"
                    >
                      {{ InData.original }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle>
                      {{ data.subtitle }}
                    </v-list-item-subtitle>
                  </v-list-item-content>

                  <v-btn
                    icon
                    large
                    :color="get_status_icon(data.courseID).color"
                    @click="change_course_select_status(data.courseID)"
                  >
                    <v-icon>{{ get_status_icon(data.courseID).icon }}</v-icon>
                  </v-btn>
                </v-list-item>
              </v-card>
            </v-list>
          </v-card>
        </v-card>

        <!-- Support Table -->
        <br />
        <v-card class="align-self-center" flat>
          <v-card
            class="pa-2 mx-auto"
            elevation="5"
            align="center"
            justify="center"
            outlined
            tile
            min-width="200px"
            min-height="50px"
          >
            <h4>發生問題、課程問題，請寄送 Email 至</h4>
            <a>ntpu-timetable-support@googlegroups.com</a>
          </v-card>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <!-- Time Table -->
        <div ref="thehtml">
          <v-simple-table>
            <template v-slot:default>
              <thead>
                <tr>
                  <th v-for="data in days_data" :key="data" class="text-left">
                    <v-card
                      class="align-self-center"
                      flat
                      min-width="90px"
                      min-height="30px"
                      align="center"
                      justify="center"
                      >{{ data }}
                    </v-card>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="data in body_data" :key="data">
                  <td v-for="item in data" :key="item">
                    <v-card
                      class="align-self-center"
                      flat
                      :color="item.color"
                      min-width="90px"
                      min-height="60px"
                      align="center"
                      justify="center"
                    >
                      <v-list-item-content v-if="item.show_title">
                        <div class="overline mb-4">
                          {{ item.title }}
                        </div>
                        <v-list-item-subtitle>
                          {{ item.subtitle }}
                        </v-list-item-subtitle>
                      </v-list-item-content>

                      <v-card-text
                        align="center"
                        justify="center"
                        v-if="item.show_chip"
                      >
                        <v-chip-group
                          v-model="selection"
                          active-class=""
                          column
                          multiple
                        >
                          <v-chip
                            :color="data.color"
                            v-for="data in item.chip"
                            :key="data"
                            @click="
                              overlay = !overlay;
                              overlay_courseID = data.courseID;
                              write_overlay();
                            "
                          >
                            {{ data.title }}
                          </v-chip>
                        </v-chip-group>
                      </v-card-text>
                    </v-card>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </div>
      </v-col>
    </v-row>
    <br />
  </div>
</template>

<script>
import course_json from "../../clawer/all_course_list.json";
export default {
  name: "Home",
  components: {},
  data: () => ({
    window_height: 700,
    window_width: 1600,
    list_data: [],
    days_data: ["😀", "日", "一", "二", "三", "四", "五", "六"],
    body_data: [],
    course_data: course_json,
    search_input: "",
    search_result: "",
    search_list: [
      {
        title: "[Feature🛠] Search🔍",
        subtitle: "You can fill in the key word and search courses!",
        courseID: "0000",
        color: "",
      },
    ],
    fliter_chips: [],
    fliter_items: [],
    fliter_time: [
      "週一上午",
      "週一下午",
      "週二上午",
      "週二下午",
      "週三上午",
      "週三下午",
      "週四上午",
      "週四下午",
      "週五上午",
      "週五下午",
      "週六上午",
      "週六下午",
      "週日上午",
      "週日下午",
    ],
    select_list: [],
    color_table: [
      "#E6B0AA",
      "#5499C7",
      "#D7BDE2",
      "#D2B4DE",
      "#A9CCE3",
      "#AED6F1",
      "#A3E4D7",
      "#A2D9CE",
      "#A9DFBF",
      "#ABEBC6",
      "#F9E79F",
      "#FAD7A0",
      "#F5CBA7",
      "#EDBB99",
    ],
    overlay: false,
    overlay_courseID: "",
    overlay_data: {
      year: "",
      semester: "",
      courseID: "",
      department: "",
      department_level: [],
      compulsory: [],
      title: {
        ch: "",
        en: "",
        limit: false,
        other: "",
      },
      teacher: [""],
      category: "",
      credit: "",
      hours: "",
      language: "",
      course_detail: [
        {
          courseTime: 1,
          time_category: "",
          sessions: [],
          place: "",
          original: "",
        },
      ],
      sign: "",
      sign_people: "",
      max_people: "",
      url: "",
      show_credit: 0,
      show_hours: 0,
    },
  }),
  mounted() {
    this.html = this.$refs.thehtml;
  },
  methods: {
    // Init Table
    init_table() {
      for (var i = 0; i < 11; i++) {
        var tmp = [];
        for (var j = 0; j < 8; j++) {
          tmp.push({
            title: "",
            subtitle: "",
            chip: [],
            color: "white",
            show_title: false,
            show_chip: true,
          });
          if (i == 4) {
            tmp[j]["chip"].push({
              title: "❌",
              color: "white",
            });
          }
        }
        tmp[0]["show_title"] = true;
        tmp[0]["show_chip"] = false;
        let time_table = [
          "1",
          "2",
          "3",
          "4",
          "中午",
          "5",
          "6",
          "7",
          "8",
          "9",
          "晚上",
        ];
        let time_table_time = [
          "08:10 ~ 09:00",
          "09:10 ~ 10:00",
          "10:10 ~ 11:00",
          "11:10 ~ 12:00",
          "12:10 ~ 13:00",
          "13:10 ~ 14:00",
          "14:10 ~ 15:00",
          "15:10 ~ 16:00",
          "16:10 ~ 17:00",
          "17:10 ~ 18:00",
          "18:30 ~ 22:10",
        ];
        tmp[0]["title"] = time_table[i];
        tmp[0]["subtitle"] = time_table_time[i];
        this.body_data.push(tmp);
      }
      // this.write_course();
      let selectCourse = this.get_course_select_status();
      if (!this.show_credit) this.show_credit = 0;
      if (!this.show_hours) this.show_hours = 0;
      for (i = 0; i < selectCourse.length; i++) {
        let tmp_course_detail = selectCourse[i].course_detail;
        this.show_credit += parseInt(selectCourse[i].credit);
        this.show_hours += parseInt(selectCourse[i].hours);
        for (j = 0; j < tmp_course_detail.length; j++) {
          let tmp_time = tmp_course_detail[j].courseTime;
          let tmp_sessions = tmp_course_detail[j].sessions;
          for (var k = 0; k < tmp_sessions.length; k++) {
            var convert_time = -1;
            var convert_sessions = -1;
            if (tmp_time === 7) {
              convert_time = 1;
            } else {
              convert_time = tmp_time + 1;
            }
            if (tmp_sessions[k] >= 1 && tmp_sessions[k] <= 4) {
              convert_sessions = tmp_sessions[k] - 1;
            } else if (tmp_sessions[k] >= 5 && tmp_sessions[k] <= 9) {
              convert_sessions = tmp_sessions[k];
            } else {
              convert_sessions = 10;
              k += 10;
            }
            this.change_body_chip(true, convert_sessions, convert_time, {
              title: selectCourse[i].courseID + " " + selectCourse[i].title.ch,
              color: this.color_table[selectCourse[i].index % 14],
              courseID: selectCourse[i].courseID,
            });
          }
        }
      }
      for (i = 0; i < this.fliter_time.length; i++) {
        this.fliter_items.push(this.fliter_time[i]);
      }
      for (i = 0; i < this.course_data.fliter_item.length; i++) {
        this.fliter_items.push(this.course_data.fliter_item[i]);
      }
    },
    // Print CourseData
    write_course(mode, chipData) {
      if (mode) {
        this.show_credit += parseInt(chipData.credit);
        this.show_hours += parseInt(chipData.hours);
      } else {
        this.show_credit -= parseInt(chipData.credit);
        this.show_hours -= parseInt(chipData.hours);
      }
      let detail = chipData.course_detail;
      for (var i = 0; i < detail.length; i++) {
        let tmp_time = detail[i].courseTime;
        let tmp_sessions = detail[i].sessions;
        for (var j = 0; j < tmp_sessions.length; j++) {
          var convert_time = -1;
          var convert_sessions = -1;
          if (tmp_time === 7) {
            convert_time = 1;
          } else {
            convert_time = tmp_time + 1;
          }
          if (tmp_sessions[j] >= 1 && tmp_sessions[j] <= 4) {
            convert_sessions = tmp_sessions[j] - 1;
          } else if (tmp_sessions[j] >= 5 && tmp_sessions[j] <= 9) {
            convert_sessions = tmp_sessions[j];
          } else {
            convert_sessions = 10;
            j += 10;
          }
          this.change_body_chip(mode, convert_sessions, convert_time, {
            title: chipData.courseID + " " + chipData.title.ch,
            color: this.color_table[chipData.index % 14],
            courseID: chipData.courseID,
          });
        }
      }
    },
    // 改變 chip 內容
    change_body_chip(mode, r, c, chipData) {
      if (mode) {
        this.body_data[r][c]["chip"].push({
          title: chipData.title,
          color: chipData.color,
          courseID: chipData.courseID,
        });
      } else {
        var tmp_list = [];
        for (var i = 0; i < this.body_data[r][c]["chip"].length; i++) {
          if (
            this.body_data[r][c]["chip"][i]["courseID"] != chipData.courseID
          ) {
            tmp_list.push({
              title: this.body_data[r][c]["chip"][i].title,
              color: this.body_data[r][c]["chip"][i].color,
              courseID: this.body_data[r][c]["chip"][i].courseID,
            });
          }
        }
        this.body_data[r][c]["chip"] = tmp_list;
      }
      this.body_data[r][c]["color"] = this.get_table_card_color(
        this.body_data[r][c]["chip"]
      );
    },
    // 取得表格內 card 顏色
    get_table_card_color(chip) {
      if (chip.length > 1) {
        return "red";
      }
      return "white";
    },
    // 搜尋課程
    search_course() {
      if (this.search_input === "" && this.fliter_chips.length === 0)
        return false;
      this.search_list = [];
      var flag = 0;
      for (var i = 0; i < this.course_data.data.length; i++) {
        this.search_result = "找到 " + String(flag) + " 個課程";
        if (flag >= 150) {
          this.search_result =
            "找到 " +
            String(flag) +
            "+ 項資料，最多顯示 " +
            String(flag) +
            " 筆資料";
          return 0;
        }
        let tmp = this.course_data.data[i];
        let tmp_json = [
          tmp.courseID,
          tmp.title.ch,
          tmp.title.en,
          tmp.teacher,
          tmp.department,
        ];
        if (String(tmp_json).indexOf(this.search_input) !== -1) {
          let fliter_flag = this.verify_search_item(tmp);
          if (fliter_flag.result === true) {
            this.search_list.push({
              title: tmp.courseID + " " + tmp.title.ch,
              subtitle:
                tmp.teacher +
                " | 學分 / 時數: " +
                tmp.credit +
                " / " +
                tmp.hours,
              courseID: tmp.courseID,
              department: tmp.department,
              course_detail: tmp.course_detail,
              color: fliter_flag.color,
            });
            flag += 1;
          }
        }
      }
      if (this.search_list.length === 0) {
        this.search_list.push({
          title: "404 Not Found!",
          subtitle: "Please change the key word and search again!",
          courseID: "0000",
          color: "orange",
        });
      }
    },
    // 驗證 fliter 後資料是否可用
    verify_search_item(item) {
      var time_exite = false;
      var department_exite = false;
      var time_flag = false;
      var department_flag = false;
      var color_flag = "";
      if (this.fliter_chips.length == 0) {
        return {
          result: true,
          color: "",
        };
      } else {
        for (var i = 0; i < this.fliter_chips.length; i++) {
          var tmp_time = false;
          for (var j = 0; j < this.fliter_time.length; j++) {
            if (this.fliter_chips[i] === this.fliter_time[j]) {
              tmp_time = true;
              time_exite = true;
              if (this.single_verify_search_item_time(j, item)) {
                time_flag = true;
              }
            }
          }
          if (!tmp_time) {
            department_exite = true;
            if (
              this.single_verify_search_item_department(
                this.fliter_chips[i],
                item
              )
            ) {
              department_flag = true;
              if (color_flag === "") {
                color_flag = this.get_search_item_department_color(
                  this.fliter_chips[i],
                  item
                );
              }
            }
          }
        }
        if (time_exite === true && department_exite === true) {
          if (time_flag === true && department_flag === true) {
            return {
              result: true,
              color: color_flag,
            };
          }
        } else {
          if (time_flag === true || department_flag === true) {
            return {
              result: true,
              color: color_flag,
            };
          }
        }
      }
      return {
        result: false,
        color: color_flag,
      };
    },
    // 驗證 fliter 後資料是否可用
    single_verify_search_item_time(j, item) {
      for (var k = 0; k < item.course_detail.length; k++) {
        if (item.course_detail[k].courseTime === Math.floor(j / 2) + 1) {
          for (var l = 0; l < item.course_detail[k].sessions.length; l++) {
            if (item.course_detail[k].sessions[l] <= 4 && j % 2 == 0) {
              return true;
            } else if (item.course_detail[k].sessions[l] >= 5 && j % 2 == 1) {
              return true;
            }
          }
        }
      }
      return false;
    },
    // 驗證 fliter 後資料是否可用
    single_verify_search_item_department(fliter, item) {
      for (var j = 0; j < item.department_level.length; j++) {
        if (fliter === item.department_level[j].original) {
          return true;
        }
      }
      return false;
    },
    // 驗證 fliter 後資料呈現顏色
    get_search_item_department_color(fliter, item) {
      var f = this.get_compulsory(item, fliter);
      if (f == "必") {
        return "#FFF1EF";
      } else if (f == "選") {
        return "#EDFBFF";
      }
      return "";
    },
    // 取得課程選擇項目按鈕
    get_status_icon(ID) {
      var output = {
        icon: "mdi-plus",
        color: "blue",
      };
      if (ID === "0000") {
        output["icon"] = "mdi-close";
        output["color"] = "red";
      } else {
        var tmp_list = this.get_course_select_status();
        for (var i = 0; i < tmp_list.length; i++) {
          if (tmp_list[i].courseID == ID) {
            output["icon"] = "mdi-close";
            output["color"] = "red";
          }
        }
      }
      return output;
    },
    // 取得 storage 項目
    get_course_select_status() {
      return JSON.parse(localStorage.getItem("SelectCourse"));
    },
    // 改變 storage 項目
    change_course_select_status(ID) {
      if (ID === "0000") return false;
      var tmp_list = this.get_course_select_status();
      var flag = false;
      for (var i = 0; i < tmp_list.length; i++) {
        if (tmp_list[i].courseID == ID) {
          flag = true;
        }
      }
      var tmp_data = this.get_courseID_data(ID);
      if (flag) {
        var tmp = [];
        for (var j = 0; j < tmp_list.length; j++) {
          if (tmp_list[j].courseID != ID) {
            tmp.push(tmp_list[j]);
          }
        }
        tmp_list = tmp;
        this.write_course(false, tmp_data);
      } else {
        tmp_data["index"] = tmp_list.length;
        tmp_list.push(tmp_data);
        this.write_course(true, tmp_data);
      }
      localStorage.setItem("SelectCourse", JSON.stringify(tmp_list));
      this.search_course();
      this.select_list_maker();
    },
    // 創造 select_list
    select_list_maker() {
      this.select_list = [];
      let tmp_list = this.get_course_select_status();
      for (var i = 0; i < tmp_list.length; i++) {
        this.select_list.push({
          title: tmp_list[i].courseID + " " + tmp_list[i].title.ch,
          subtitle:
            tmp_list[i].teacher +
            " | 學分 / 時數: " +
            tmp_list[i].credit +
            " / " +
            tmp_list[i].hours,
          courseID: tmp_list[i].courseID,
          department: tmp_list[i].department,
          course_detail: tmp_list[i].course_detail,
        });
      }
    },
    // overlay
    get_compulsory(course, department_level) {
      var flag = -1;
      for (var i = 0; i < course.department_level.length; i++) {
        if (department_level == course.department_level[i].original) {
          flag = i;
        }
      }
      if (flag === -1) {
        return "Error!";
      }
      let compulsory_len = course.compulsory.length;
      if (flag >= compulsory_len) {
        return course.compulsory[compulsory_len - 1];
      }
      return course.compulsory[flag];
    },
    // 獲得課程資訊
    get_courseID_data(ID) {
      for (var i = 0; i < this.course_data.data.length; i++) {
        if (this.course_data.data[i].courseID == ID) {
          return this.course_data.data[i];
        }
      }
      return {
        year: "",
        semester: "",
        courseID: ID,
        department: "",
        department_level: [],
        compulsory: [],
        title: {
          ch: "Error",
          en: "Cannot get data",
          limit: false,
          other: "",
        },
        teacher: [""],
        category: "",
        credit: "",
        hours: "",
        language: "",
        course_detail: [
          {
            courseTime: 1,
            time_category: "",
            sessions: [],
            place: "",
            original: "",
          },
        ],
        sign: "",
        sign_people: "",
        max_people: "",
        url: "",
        show_credit: 0,
        show_hours: 0,
      };
    },
    fliter_remove(item) {
      this.fliter_chips.splice(this.fliter_chips.indexOf(item), 1);
      this.fliter_chips = [...this.fliter_chips];
    },
    onClickOutside() {
      this.overlay = false;
    },
    write_overlay() {
      this.overlay_data = this.get_courseID_data(this.overlay_courseID);
    },
  },
  created: function () {
    this.window_height = window.innerHeight;
    this.window_width = window.innerWidth;
    if (!localStorage.getItem("SelectCourse")) {
      localStorage.setItem("SelectCourse", JSON.stringify([]));
    }
    this.select_list_maker();
    this.init_table();
  },
};
</script>
