<template>
  <v-app>
    <v-app-bar app dark>
      <v-app-bar-title>NTPU 課程試排</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn rounded>
        <v-icon start>mdi-calendar</v-icon>
        {{ config_data.year }} 學年 | 第 {{ config_data.semester }} 學期
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-card>
        <v-card>
          <v-alert type="warning" closable density="compact">
            此僅為試排課程，請依然要到選課系統選課。
          </v-alert>
        </v-card>
        <router-view />

        <v-footer class="font-weight-medium">
          <v-col class="text-center" cols="12" style="font-size: 14px">
            &copy; {{ new Date().getFullYear() }} Copyright
            <a href="https://littlechintw.github.io">littlechintw.github.io</a>.
            All rights reserved.
          </v-col>
        </v-footer>
      </v-card>
    </v-main>
  </v-app>
</template>

<script>
import config from "./config.json";
import { useStore } from "vuex";
import { onMounted, ref } from "vue";

export default {
  name: "App",
  setup() {
    const store = useStore();
    const window_height = ref(700);
    const window_width = ref(1600);
    const config_data = ref(config);

    onMounted(() => {
      window_height.value = window.innerHeight;
      window_width.value = window.innerWidth;
      
      // 更新 store 中的 window height
      store.dispatch('updateWindowHeight', window.innerHeight);
    });

    return {
      window_height,
      window_width,
      config_data,
    };
  },
};
</script>
