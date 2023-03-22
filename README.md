# GitHub Task Manageer

網站連結：[https://github-task-nine.vercel.app/](https://github-task-nine.vercel.app/)

Tech Stack
- Next.js
- TypeScript
- React Query
- Tailwind CSS
- React-Hook-Form

##主要內容
- [Login Page](#login-page)
- [Home Page](#home-page)
- [Issue Detail Page](#issue-detail-page)

## Login Page

使用 NextAuth 進行 GitHub 登入

在`server/auth.ts`中設定GitHub Provider並定義scope


## Home Page
```javascript
const url = `https://api.github.com/search/issues?q=author:${username}+type:issue+is:open+-is:pr&sort=created&order=desc&per_page=${pageSize}&page=${pageNumber}`;
```
url: 搜尋所有作者為使用者的 open issue，去除掉 pull request，並以 desc 排序，每次回傳 10 筆資料

[GitHub Search API](https://docs.github.com/en/rest/search?apiVersion=2022-11-28#search-issues-and-pull-requests)

```javascript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      ["issues"],
      ({ pageParam = 1 }) => fetchIssues(pageParam),
      {
        getNextPageParam: (lastPage, allPages) => {
          const maxpages = Math.ceil(lastPage.total_count / 10);
          const nextpage = allPages.length + 1;
          return nextpage <= maxpages ? nextpage : undefined;
        },
      }
    );
```
用 React Query 中的 `useInfiniteQuery` 搭配 useEffect 及 eventlistener 達成 infinite scroll 

每次滑到底時都發送API載入額外10筆資料

另外設有 search bar, label, sorted by ASC/DESC 三種 filter ，可以同時對資料進行篩選

## Issue Detail page
[GitHub Issue API](https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28)

展示該 issue 的詳細內容
在 Edit 的 modal 中可以編輯 title 及 body, 此外也能夠更新 label(done/in progress/ open)
Delete button 會將此 issue 的 state 轉為 close 並 redirect 回 home page 
