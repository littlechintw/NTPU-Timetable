import { createStore } from 'vuex'

export default createStore({
  state: {
    windowHeight: window.innerHeight
  },
  getters: {
    windowHeight: (state) => state.windowHeight
  },
  mutations: {
    SET_WINDOW_HEIGHT(state, height) {
      state.windowHeight = height
    }
  },
  actions: {
    updateWindowHeight({ commit }, height) {
      commit('SET_WINDOW_HEIGHT', height)
    }
  },
  modules: {
  }
})
