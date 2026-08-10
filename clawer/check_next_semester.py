# -- coding:UTF-8 --
"""
config.json 目前是手動切換學年學期。這支腳本讓切換自動化：
定期探測「下一個學期」是否已經在北大課程查詢系統開放，一旦偵測到就更新 config.json，
讓後續（本次或下一次）的 main.py 爬蟲改抓新學期的資料。

判斷「下一個學期」的規則：
- 目前是第 1 學期（上學期）-> 下一個要看的是「同一學年、第 2 學期」（約 12-2 月開放）
- 目前是第 2 學期（下學期）-> 下一個要看的是「下一學年、第 1 學期」（約 6-8 月開放）

每次執行前會先檢查 config.json 是不是已經完成這個監控窗口該做的切換
（例如 12-2 月的窗口只在 config 還是第 1 學期時才有意義），
已經切換過就直接跳過，不會再去打北大網站探測，避免整個監控窗口剩下的時間都在問已經確定還沒開放的下下學期。

由 .github/workflows/CheckNextSemester.yml 排程執行（每週二、五檢查一次）。
"""
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import main as crawler  # noqa: E402  (reuse get_course/load_config/save_json_file/logger)


def compute_next_semester(year, semester):
    """Given the currently configured (year, semester), return the next one to watch for."""
    if semester == 1:
        return year, 2
    return year + 1, 1


def expected_pre_switch_semester(now=None):
    """Which semester config.json "should" still be on for this month's watch window to be relevant.
    12-2 月是在等第 1 學期切到第 2 學期，所以在那之前 config 應該還是 semester 1；
    6-8 月是在等第 2 學期切到下一年第 1 學期，所以在那之前 config 應該還是 semester 2。
    回傳 None 代表現在不在任何監控窗口內（例如手動執行時撞到非窗口月份），不做判斷。"""
    month = (now or datetime.now(timezone.utc)).month
    if month in (12, 1, 2):
        return 1
    if month in (6, 7, 8):
        return 2
    return None


def is_semester_published(year, semester):
    """Probe the course query system the same way main.py's real crawl does (all 7 weekday buckets).
    Any non-empty result means the semester's course list has been published."""
    for week in range(1, 8):
        if crawler.get_course(year, semester, week):
            return True
    return False


def write_github_output(name, value):
    path = os.environ.get('GITHUB_OUTPUT')
    if not path:
        return
    with open(path, 'a', encoding='utf-8') as f:
        f.write(f"{name}={value}\n")


def main():
    config = crawler.load_config()
    if not config:
        crawler.logger.error("無法讀取 config.json，中止檢查")
        write_github_output('updated', 'false')
        sys.exit(1)

    current_year = int(config['year'])
    current_semester = int(config['semester'])

    # 先確認這次監控窗口要等的切換是不是已經做過了，做過就不用再打北大網站探測
    expected = expected_pre_switch_semester()
    if expected is not None and current_semester != expected:
        crawler.logger.info(
            f"目前已經是第 {current_semester} 學期，這個監控窗口要等的切換已經完成，不需要再探測"
        )
        write_github_output('updated', 'false')
        return

    next_year, next_semester = compute_next_semester(current_year, current_semester)

    crawler.logger.info(
        f"目前設定：{current_year} 學年第 {current_semester} 學期；"
        f"檢查是否已開放：{next_year} 學年第 {next_semester} 學期"
    )

    if not is_semester_published(next_year, next_semester):
        crawler.logger.info("尚未開放，不做變更")
        write_github_output('updated', 'false')
        return

    crawler.logger.info(f"偵測到 {next_year} 學年第 {next_semester} 學期資料已開放，更新 config.json")
    config['year'] = next_year
    config['semester'] = next_semester
    if not crawler.save_json_file(config, 'config.json'):
        crawler.logger.error("寫入 config.json 失敗")
        write_github_output('updated', 'false')
        sys.exit(1)

    write_github_output('updated', 'true')
    write_github_output('next_year', str(next_year))
    write_github_output('next_semester', str(next_semester))


if __name__ == '__main__':
    main()
