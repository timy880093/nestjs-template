export class UrlParser {
  static join(...urls: string[]): string {
    return urls
      .filter((url) => url)
      .map((url, index) => {
        // 去掉每個 URL 開頭和結尾的斜線，除了第一個和最後一個
        if (index === 0) return url.replace(/\/+$/, '');
        if (index === urls.length - 1) return url.replace(/^\/+/, '');
        return url.replace(/^\/+|\/+$/g, '');
      })
      .filter((url) => url.length > 0) // 過濾掉空的部分
      .join('/');
  }
}
