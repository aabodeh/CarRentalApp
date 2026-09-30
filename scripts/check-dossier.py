#!/usr/bin/env python3
"""Read-only consistency check of the AI dossier (docs/ai-log).

Run from the repository root:  python3 scripts/check-dossier.py

It changes nothing. It prints: numbering gaps, date order, each entry's PR link, whether every
referenced prompt file exists, whether the README index matches the files on disk, unresolved
[[wikilinks]], and every field or section still marked TODO, grouped by entry.
"""
import os
import re

root='docs/ai-log'
def fm(path):
    s=open(path).read()
    m=re.match(r'---\n(.*?)\n---\n',s,re.S)
    d={}
    if m:
        for line in m.group(1).split('\n'):
            if ':' in line:
                k,v=line.split(':',1); d[k.strip()]=v.strip()
    return d,s
out={}
for kind,prefix in (('interactions','A'),('failures','FL')):
    files=sorted(os.listdir(f'{root}/{kind}'))
    rows=[]
    for f in files:
        d,s=fm(f'{root}/{kind}/{f}')
        rows.append(dict(file=f,fid=f.split(' ')[0],d=d,s=s))
    out[kind]=rows
    ids=[r['fid'] for r in rows]
    nums=[int(i.split('-')[1]) for i in ids]
    print(f'== {kind}: {len(rows)} files, ids {ids[0]}..{ids[-1]}')
    print('   gaps:', [n for n in range(1,max(nums)+1) if n not in nums] or 'none')
    print('   id in frontmatter != filename:', [(r['file'][:30],r['d'].get('id')) for r in rows if r['d'].get('id')!=r['fid']] or 'none')
    dates=[r['d'].get('date','') for r in rows]
    print('   dates:', ' '.join(f"{i}={d[5:]}" for i,d in zip(ids,dates)))
    print('   chronological by id:', dates==sorted(dates))
A=out['interactions']; F=out['failures']
print('\n== A entries: related_pr')
for r in A: print('  ',r['fid'], r['d'].get('related_pr') or 'EMPTY')
print('\n== FL entries: related_interaction -> exists?')
aids={r['fid'] for r in A}
for r in F:
    ri=r['d'].get('related_interaction','')
    refs=re.findall(r'A-\d{3}',ri)
    print('  ',r['fid'], ri or 'EMPTY', '' if all(x in aids for x in refs) and refs else '<-- PROBLEM')
print('\n== prompt files')
prompts=sorted(os.listdir(f'{root}/prompts'))
print('   on disk:',prompts)
refs=set()
for r in A+F:
    for m in re.findall(r'\[\[(P\d+)\]\]',r['s']): refs.add(m)
readme=open(f'{root}/README.md').read()
for m in re.findall(r'\[\[(P\d+)\]\]',readme): refs.add(m)
print('   referenced:',sorted(refs,key=lambda x:int(x[1:])))
print('   referenced but missing:',[p for p in refs if p+'.md' not in prompts] or 'none')
print('   on disk but never referenced:',[p for p in prompts if p[:-3] not in refs] or 'none')
print('   prompt_or_link per A:', {r['fid']:r['d'].get('prompt_or_link') for r in A})
print('\n== wikilinks that do not resolve')
names={f[:-3] for k in ('interactions','failures','prompts') for f in os.listdir(f'{root}/{k}')}
bad=[]
for path,_,fs in os.walk('docs'):
    for f in fs:
        if f.endswith('.md'):
            s=open(os.path.join(path,f)).read()
            # Ignore `code`: a [[link]] quoted as an example is not a link.
            for m in re.findall(r'\[\[([^\]|#]+)',re.sub(r'`[^`]*`','',s)):
                if m not in names: bad.append((os.path.join(path,f)[5:],m))
print('  ',bad or 'none')
print('\n== README index vs disk')
idxA=re.findall(r'^\| \[\[(A-\d{3}[^\]]*)\]\]',readme,re.M); idxF=re.findall(r'^\| \[\[(FL-\d{3}[^\]]*)\]\]',readme,re.M)
diskA=[r['file'][:-3] for r in A]; diskF=[r['file'][:-3] for r in F]
print('   A in index:',len(idxA),'on disk:',len(diskA),'| missing from index:',[x for x in diskA if x not in idxA] or 'none','| in index not on disk:',[x for x in idxA if x not in diskA] or 'none')
print('   FL in index:',len(idxF),'on disk:',len(diskF),'| missing from index:',[x for x in diskF if x not in idxF] or 'none','| in index not on disk:',[x for x in idxF if x not in diskF] or 'none')
print('   index order == id order:', idxA==diskA, idxF==diskF)
print('\n== index rows: PR link vs entry related_pr')
for line in readme.split('\n'):
    m=re.match(r'^\| \[\[(A-\d{3})[^\]]*\]\]',line)
    if m:
        pr=re.findall(r'pull/(\d+)',line)
        entry=[r for r in A if r['fid']==m.group(1)][0]['d'].get('related_pr','')
        epr=re.findall(r'pull/(\d+)',entry)
        print('  ',m.group(1),'index PR:',pr or '-', 'entry PR:',epr or (entry or 'EMPTY'))

print('\n== TODO by entry (frontmatter fields and body sections)')
total = 0
for kind in ('interactions', 'failures'):
    for f in sorted(os.listdir(f'{root}/{kind}')):
        s = open(f'{root}/{kind}/{f}').read()
        m = re.match(r'---\n(.*?)\n---\n(.*)', s, re.S)
        front, body = m.group(1), m.group(2)
        items = ['field `' + line.split(':')[0].strip() + '`' for line in front.split('\n') if 'TODO' in line]
        section = None
        for line in body.split('\n'):
            h = re.match(r'^#{2,3} (.+)', line)
            if h:
                section = h.group(1)
            # A TODO quoted as `code` is the word being mentioned, not something left to do.
            elif 'TODO' in re.sub(r'`[^`]*`', '', line) and section and ('section: ' + section) not in items:
                items.append('section: ' + section)
        if items:
            total += len(items)
            print(f"   {f.split(' ')[0]}: " + '; '.join(items))
print('   total open items:', total)
