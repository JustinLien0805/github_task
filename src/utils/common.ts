export function getRepoName(repoUrl: string) {
  repoUrl.lastIndexOf("/");
  const repoName = repoUrl.slice(repoUrl.lastIndexOf("/") + 1);
  return repoName;
}
export function getRepoUrl(repoUrl: string) {
  const newrepoUrl =
    repoUrl?.slice(0, 8) + repoUrl?.slice(12, 22) + repoUrl?.slice(28);
  return newrepoUrl;
}
