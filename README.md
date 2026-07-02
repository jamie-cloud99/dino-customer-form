# Dino Customer Form

把原本的 `龍客服表單.html` 拆成可長期微調的靜態專案。

## 檔案結構

- `index.html`：頁面內容與載入順序
- `src/styles.css`：視覺樣式、色票、RWD
- `src/main.js`：評分、報告產生、複製與圖片下載互動
- `original/龍客服表單.html`：原始 HTML 備份

## 使用方式

直接用瀏覽器開啟 `index.html` 即可。

如果要用本機伺服器預覽：

```sh
python3 -m http.server 5173
```

然後開啟 `http://localhost:5173`。

## 後續微調建議

- 改文字：優先看 `index.html`
- 改顏色、間距、手機版：優先看 `src/styles.css`
- 改評分項目、總評規則、報告格式：優先看 `src/main.js`
