# 北大課程試排（NTPU Timetable）

[國立臺北大學](https://www.ntpu.edu.tw/)非官方的課程試排工具。搜尋課程、套用篩選條件、把課加進課表看看會不會衝堂，排出理想的課表後再到學校官方選課系統實際選課。

**線上使用：[ntpu-timetable.littlechin.tw](https://ntpu-timetable.littlechin.tw)**

> ⚠️ 這是非官方工具，僅供試排參考，並不會真的幫你選到課，也不保證課程資料完全正確即時。請以學校官方選課系統及公告為準。

![淺色模式畫面](docs/assets/screenshot-light.png)

## 特色

- **關鍵字搜尋**：課程編號、課程名稱、教師、系所皆可搜尋。
- **多條件篩選**：系所、必修/選修、學分數、上課時間，同類別「或」、跨類別「且」。
- **即時衝堂提示**：課表格子與搜尋結果都會標紅提醒時間重疊的課程。
- **深色模式**：自動偵測系統偏好，也可手動切換並記住選擇。
- **資料自動更新**：GitHub Actions 定期（每週二、四、六）從學校課程查詢系統抓取最新資料。

完整使用方式請見 [使用說明](docs/USAGE.md)。

## 技術棧

- [Vue 3](https://vuejs.org/)（`<script setup>`） + [Vite](https://vite.dev/)
- [Vue Router](https://router.vuejs.org/)、[Pinia](https://pinia.vuejs.org/)
- 課程資料爬蟲：Python（`requests` + `BeautifulSoup`），見 [`clawer/main.py`](clawer/main.py)
- 部署：GitHub Actions 建置後發布到 GitHub Pages（自訂網域 `ntpu-timetable.littlechin.tw`）

## 開發

需要 Node.js `^20.19.0` 或 `>=22.12.0`。

```sh
npm install    # 安裝依賴
npm run dev    # 啟動開發伺服器（含 HMR）
npm run build  # 建置正式版本到 dist/
npm run lint   # ESLint 檢查並自動修正
npm run format # Prettier 格式化 src/
```

開發模式下，前端會直接讀取 repo 內既有的 `clawer/all_course_list.json` 與 `config.json`；正式部署時，CI 會把這兩個檔案複製進 `public/` 再建置（見 [`.github/workflows/Build.yml`](.github/workflows/Build.yml)）。

### 專案結構

```
src/
├─ views/HomeView.vue   # 主要功能：搜尋、篩選、課表、選課邏輯
├─ App.vue              # 版面外框、頂部導覽列、深色模式狀態
├─ router/               # 路由設定
└─ stores/               # Pinia store（目前僅範例，尚未使用）

clawer/
├─ main.py                  # 課程資料爬蟲
├─ check_next_semester.py   # 偵測下一學期是否已開放，自動切換 config.json
├─ all_course_list.json     # 目前學期的課程資料（由爬蟲產生）
└─ *all_course_list.json    # 歷史學期資料存檔

config.json              # 目前顯示的學年、學期（爬蟲與前端共用）
```

### 課程資料

課程資料由 [`clawer/main.py`](clawer/main.py) 向北大課程查詢系統抓取，寫成 `clawer/all_course_list.json`；`config.json` 決定要抓哪個學年學期。要手動跑一次爬蟲：

```sh
pip install -r clawer/requirements.txt
python3 clawer/main.py
```

正式環境的資料更新由 [`.github/workflows/Clawer.yml`](.github/workflows/Clawer.yml) 排程執行並自動提交（每週二、四、六）。

`config.json` 的學年學期不用再手動切換：[`.github/workflows/CheckNextSemester.yml`](.github/workflows/CheckNextSemester.yml) 會在 12-2 月、6-8 月的週二、五自動探測下一學期是否已在北大課程查詢系統開放，一偵測到就更新 `config.json` 並立即跑一次爬蟲。

已選課程如果因為學期切換（或課程被停開、改時間）而跟最新資料不一致，前端會自動把它從課表移除，並跳出通知列出異動前後的內容（見 [`reconcileSelectedCourses`](src/views/HomeView.vue)）。

## 問題回報

- 使用上的問題或建議：`ntpu-timetable-support@googlegroups.com`
- 程式錯誤（bug）或功能建議：[GitHub Issues](https://github.com/littlechintw/NTPU-Timetable/issues)
