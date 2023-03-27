# GitHub Task Manageer

網站連結：[https://github-task-manager.vercel.app/](https://github-task-manager.vercel.app/)

## 目錄
  - [Tech Stack](#tech-stack)
  - [Login Page](#login-page)
  - [Home Page](#home-page)
  - [Issue Detail page](#issue-detail-page)

## Tech Stack
- Next.js
- TypeScript
- React Query
- Tailwind CSS
- React-Hook-Form




## Login Page

使用 NextAuth 進行 GitHub 登入

在`server/auth.ts`中設定 GitHub Provider 並定義 scope

## Home Page

```javascript
const url = `https://api.github.com/search/issues?q=${textQuery}author:${username}+type:issue+is:open+-is:pr${labelQuery}&sort=created&order=${query.sortTime}&per_page=${pageSize}&page=${pageParam}`;
```

url: 查詢所有作者為使用者的 open issue，去除掉 pull request，並以 desc 排序，label 及 title, body text 作為條件搜尋，每次回傳 10 筆資料

[GitHub Search API](https://docs.github.com/en/rest/search?apiVersion=2022-11-28#search-issues-and-pull-requests)

```javascript
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(
      ["issues", query],
      ({ pageParam = 1 }) => fetchIssues({ pageParam }),
      {
        getNextPageParam: (lastPage, allPages) => {
          const maxpages = Math.ceil(lastPage.total_count / 10);
          const nextpage = allPages.length + 1;
          return nextpage <= maxpages ? nextpage : undefined;
        },
        onError(err) {
          console.error("error", err);
        },
      }
    );
```
在 custom hook `useFilteredIssues` 中用 React Query 中的 `useInfiniteQuery` 搭配 useEffect 及 eventlistener 達成 infinite scroll，每次滑到底時都發送 API 載入額外 10 筆資料

另外設有 Query: text, label, sortedTime 三種 filter，query 改變時會發送新的 API，也有 infinite scroll 的功能

## Issue Detail page

[GitHub Issue API](https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28)

1. 展示該 issue 的詳細內容
   - 藉由 `GetServersideProps` 獲得 initial issue data 放入 `useQuery` 中，方便未來 refetch data

```javascript
export const getServerSideProps: GetServerSideProps<ComponentProps> = async (
  context
) => {
  const url = context.query.url;
  if (typeof url !== "string") {
    return {
      notFound: true,
    };
  }

  const data = await fetchIssueByUrl(url);

  return {
    props: {
      issueData: data,
    },
  };
};
```

```javascript
const { data } = useQuery(
  ["issue"],
  async () => {
    if (typeof url !== "string") {
      throw new Error("Invalid URL type");
    }
    const { data } = (await axios.get) < Issue > url;
    return data;
  },
  {
    initialData: issueData,
  }
);
```


2. 在 Edit 的 modal 中可以編輯 title 及 body, 此外也能夠更新 label(done/in progress/ open)
   - 使用 `useMutation` 來更新資料，onSucceess 後 revalidate useQuery
   
   ```javascript
   const updateIssueMutation = useMutation(updateIssue, {
     onSuccess: () => {
       alert("Issue updated successfully");
       queryClient.invalidateQueries(["issue"]);
     },
     onError: (error) => {
       console.log(error);
       alert("something went wrong");
     },
   });
   ```
3. Delete button 會將此 issue 的 state 轉為 close 並 redirect 回 home page
   - 使用 useMutation 來 close，onSucceess 後 redirect to home page
   
   ```javascript
   const closeIssueMutation = useMutation(closeIssue, {
     onSuccess: () => {
       alert("Issue closed successfully");
       router.push("/home");
       queryClient.invalidateQueries(["issue", "issues"]);
     },
     onError: (error) => {
       console.log(error);
       alert("something went wrong");
     },
   });
   ```
