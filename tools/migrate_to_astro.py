#!/usr/bin/env python3
"""Jekyll `_posts/` → Astro `src/content/posts/` 이관.

URL 보존이 이 스크립트의 첫 번째 계약이다.
Jekyll 은 `permalink: /posts/:title/` 이고 `:title` 은 **파일명의 날짜 뒤 부분**이다.
Astro 의 glob 로더도 slug 를 파일명에서 만들므로, 날짜만 떼고 같은 이름으로 쓰면
165 개 URL 이 그대로 유지된다.

저장소 루트에서 실행한다.
"""
import glob, os, re, sys, json, collections

SRC, DST = '_posts', 'src/content/posts'
AUTHOR = 'kwon_gi_beom'


def split_fm(text):
    m = re.match(r'---\n(.*?)\n---\n(.*)', text, re.S)
    return m.groups() if m else (None, None)


def get(fm, key):
    m = re.search(rf'^{key}:\s*(.+)$', fm, re.M)
    return m.group(1).strip() if m else ''


def yaml_list(raw):
    return [x.strip().strip('"\'') for x in raw.strip('[]').split(',') if x.strip()]


def q(s):
    """YAML 큰따옴표 문자열. 제목에 콜론·대괄호가 흔하므로 항상 감싼다."""
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'



def norm_date(raw, base):
    """Jekyll 은 `2025-10-26T17:31:56 +0900` 을 쓰지만 YAML 은 이걸 date 로 안 읽는다.
    `+09:00` 형태로 바꿔야 Astro 스키마의 z.date() 를 통과한다."""
    fb = re.match(r'(\d{4})-(\d{1,2})-(\d{1,2})-', base)
    fallback = (f'{fb.group(1)}-{int(fb.group(2)):02d}-{int(fb.group(3)):02d}T00:00:00+09:00'
                if fb else '1970-01-01T00:00:00+09:00')
    raw = (raw or '').strip().strip('"\'')
    if not raw:
        return fallback
    m = re.match(r'(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?\s*([+-]\d{2}):?(\d{2})?', raw)
    if not m:
        return fallback
    d, t, oh, om = m.group(1), m.group(2) or '00:00:00', m.group(3), m.group(4) or '00'
    if len(t) == 5:
        t += ':00'
    return f'{d}T{t}{oh}:{om}'


def convert_body(body):
    """Jekyll(kramdown + Liquid) 전용 문법을 순수 마크다운/HTML 로 바꾼다."""
    n = collections.Counter()

    # {% highlight python %} … {% endhighlight %} → 펜스 코드블록
    def hl(m):
        n['highlight'] += 1
        return '```' + (m.group(1) or '')
    body, c = re.subn(r'\{%\s*highlight\s+(\w+)?[^%]*%\}', hl, body)
    body, c2 = re.subn(r'\{%\s*endhighlight\s*%\}', '```', body)
    n['endhighlight'] = c2

    # ![alt](src){: width="40%"} → <img …> (kramdown 속성은 Astro 가 모른다)
    def img_attr(m):
        n['img_attr'] += 1
        alt, src, attrs = m.group(1), m.group(2), m.group(3)
        w = re.search(r'width="([^"]+)"', attrs)
        style = f' style="width:{w.group(1)}"' if w else ''
        return f'<img src="{src}" alt="{alt}"{style} />'
    body = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)\s*\{:\s*([^}]*)\}', img_attr, body)

    # 남은 kramdown 블록 속성({:.inner-borders} 등)은 의미가 없으니 지운다.
    # 코드블록 안의 파이썬 포맷 문자열({:.6f})은 건드리면 안 된다.
    parts = re.split(r'(```.*?```)', body, flags=re.S)
    for i in range(0, len(parts), 2):
        parts[i], c3 = re.subn(r'^\s*\{:\s*\.[^}]*\}\s*$', '', parts[i], flags=re.M)
        n['kramdown_attr'] += c3
    body = ''.join(parts)
    return body, n


def main():
    os.makedirs(DST, exist_ok=True)
    total = collections.Counter()
    slugs, rows = {}, []

    for path in sorted(glob.glob(f'{SRC}/*')):
        text = open(path, encoding='utf-8').read()
        fm, body = split_fm(text)
        if fm is None:
            print(f'  건너뜀(프론트매터 없음): {path}')
            continue

        base = os.path.basename(path)
        # 파일명 뒷부분이 겹치는 글이 15개 있고, 그 글들은 frontmatter 의 permalink 로
        # 충돌을 피해 두었다(02b8bd5). permalink 가 있으면 그게 URL 의 진실이다.
        pl = get(fm, 'permalink')
        if pl:
            slug = pl.strip('/').rsplit('/', 1)[-1]
        else:
            # 2025-10-26-boj_1430.markdown → boj_1430  (URL 의 :title 과 같다)
            slug = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', os.path.splitext(base)[0])
        if slug in slugs:
            print(f'  !! slug 충돌: {slug}  ({slugs[slug]} vs {base})')
        slugs[slug] = base

        title = get(fm, 'title').strip('"\'')
        date = norm_date(get(fm, 'date'), base)
        desc = get(fm, 'description').strip('"\'').replace("''", "'")
        tags = yaml_list(get(fm, 'tags'))
        cats = yaml_list(get(fm, 'categories'))

        new_body, n = convert_body(body)
        total.update(n)

        out = ['---',
               f'title: {q(title)}',
               f'author: {q(AUTHOR)}',
               f'pubDatetime: {date}',
               f'description: {q(desc)}',
               'tags: [' + ', '.join(q(t) for t in (tags or ['others'])) + ']',
               'categories: [' + ', '.join(q(c) for c in cats) + ']',
               '---', '']
        open(f'{DST}/{slug}.md', 'w', encoding='utf-8').write('\n'.join(out) + new_body.lstrip('\n'))
        rows.append(dict(slug=slug, title=title, cats=cats, url=f'/posts/{slug}/'))

    print(f'{len(rows)}개 이관 → {DST}')
    print('변환:', dict(total))
    json.dump(rows, open('migrated.json', 'w'), ensure_ascii=False, indent=1)
    return rows


if __name__ == '__main__':
    main()
