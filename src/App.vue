<template>
  <v-app>
    <v-app-bar app dark>
      <v-toolbar-title>NTPU 課程試排</v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- <v-btn
        rounded
        href="https://www.google.com/maps/d/edit?mid=1FG6nbX7nVaz5NvasFz-2s6CgZ5dUHHbE"
        target="_blank"
      >
        Google Map
        <v-icon right dark>mdi-map</v-icon>
      </v-btn> -->
    </v-app-bar>
    <v-content>
      <v-card>
        <v-content>
          <router-view />
        </v-content>

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
export default {
  name: "App",

  components: {},

  data: () => ({}),
};
</script>
