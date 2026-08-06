import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://qja1998.github.io/",
    title: "CatBus",
    description:
      "알고리즘 문제 풀이와 삽질 기록. 백준·프로그래머스 풀이가 대부분이고, PyTorch 스터디와 인프라 트러블슈팅이 섞여 있습니다.",
    author: "kwon_gi_beom",
    profile: "https://github.com/qja1998",
    lang: "ko",
    timezone: "Asia/Seoul",
    dir: "ltr",
  },
  posts: { perPage: 9, perIndex: 9, scheduledPostMargin: 15 * 60 * 1000 },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    // 저장소 경로가 Jekyll 시절과 달라 링크가 깨지므로 끈다
    editPost: { enabled: false, url: "" },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/qja1998" },
    { name: "mail", url: "mailto:qja1998@naver.com" },
  ],
  shareLinks: [
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
