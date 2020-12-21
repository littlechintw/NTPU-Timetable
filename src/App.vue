<template>
  <v-app>
    <v-app-bar app dark>
      <v-toolbar-title>NTPU 課程試排</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn rounded>
        <v-icon left dark>mdi-calendar</v-icon>
        {{ config_data.year }} 學年 | 第 {{ config_data.semester }} 學期
      </v-btn>
    </v-app-bar>
    <v-content>
      <v-card>
        <v-card>
          <v-alert type="warning" dismissible dense>
            此僅為試排課程，請依然要到選課系統選課。
          </v-alert>
        </v-card>
        <router-view />

        <v-footer padless class="font-weight-medium">
          <v-col class="text-center" cols="12" style="font-size: 14px">
            &copy; {{ new Date().getFullYear() }} Copyright
            <a href="https://littlechintw.github.io">littlechintw.github.io</a>.
            All rights reserved.
          </v-col>
        </v-footer>
      </v-card>
    </v-content>
  </v-app>
</template>

<script>
import config from "../config.json";
export default {
  name: "App",
  components: {},

  data: () => ({
    window_height: 700,
    window_width: 1600,
    config_data: config,
  }),
  created: function () {
    this.window_height = window.innerHeight;
    this.window_width = window.innerWidth;
  },
};
</script>
