// utils/api.ts
export function getIssuesSearchUrl(
    username: string,
    pageNumber: number = 1,
    pageSize: number = 10,
    query: {
      text: string;
      label: string;
      sortTime: string;
    }
  ): string {
    const { text, label, sortTime } = query;
    const queryText = text ? `${text}+in:title,body` : '';
    const queryLabel = label ? `+label:${label}` : '';
    const sortOrder = sortTime ? `&sort=created&order=${sortTime}` : '';
  
    return `https://api.github.com/search/issues?q=author:${username}+type:issue+is:open+-is:pr${queryText}${queryLabel}${sortOrder}&per_page=${pageSize}&page=${pageNumber}`;
  }
  