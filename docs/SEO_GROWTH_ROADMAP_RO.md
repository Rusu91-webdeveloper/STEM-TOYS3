# TechTots SEO Growth Roadmap Romania

## Rezumat audit

### Ce era deja bun
- Exista pagini comerciale dedicate pentru cele mai importante clustere: `/jucarii-stem`, `/jucarii-educative`, `/jucarii-inteligente`, `/robotica-pentru-copii`.
- Exista pagini regionale indexabile pentru cereri de tip oras + categorie.
- Exista infrastructura pentru metadata, schema si linking intern.

### Ce limita cresterea
- Metadata si schema globala contineau claim-uri exagerate sau neverificate.
- `robots` trimitea spre un sitemap gresit.
- Sitemap-ul nu includea URL-urile dinamice de produse si blog.
- Paginile comerciale principale aveau copy util, dar prea scurt pentru a domina clustere competitive.
- Pagini importante precum `/about`, homepage metadata si ghidul STEM transmiteau semnale de incredere prea agresive.
- Categoriile principale aveau sectiuni placeholder si titluri partial in engleza.
- Pagina de produs avea metadata prea generica si FAQ insuficient pe multe produse.

## Keyword map

| Cluster | Intentie | URL principal | URL-uri suport | Linkuri interne recomandate |
| --- | --- | --- | --- | --- |
| jucarii STEM | tranzactional / comercial | `/jucarii-stem` | `/products`, `/jucarii-stem-dupa-varsta`, `/robotica-pentru-copii`, `/categories/science-experiments` | homepage, produse, ghiduri, orase |
| jucarii educative | comercial larg | `/jucarii-educative` | `/jucarii-stem`, `/jucarii-inteligente`, `/beneficiile-jucariilor-stem` | homepage, blog, pagini trust |
| jucarii inteligente | comercial investigation | `/jucarii-inteligente` | `/robotica-pentru-copii`, `/jucarii-stem`, `/jucarii-stem-dupa-varsta` | homepage, produse, categorie matematica/logica |
| robotica pentru copii | tranzactional | `/robotica-pentru-copii` | `/categories/coding-robotics`, `/jucarii-stem-copii-6-8-ani`, `/jucarii-stem` | homepage, produse, ghiduri |
| kituri robotica copii | tranzactional | `/robotica-pentru-copii` | `/categories/coding-robotics`, produse individuale | categorii, produse, pagina STEM |
| jocuri logica copii | comercial / informational cu potential | `/jucarii-inteligente` | `/jucarii-educative`, produse, ghiduri | produse, blog, STEM dupa varsta |
| experimente stiintifice copii | tranzactional | `/categories/science-experiments` | `/jucarii-stem`, `/products`, ghiduri | homepage, ghid STEM, produse |
| jucarii STEM Bucuresti | local comercial | `/jucarii-stem/bucuresti` | `/jucarii-stem`, `/jucarii-educative`, `/robotica-pentru-copii` | homepage, pagini nationale, alte orase |
| jucarii STEM Cluj | local comercial | `/jucarii-stem/cluj-napoca` | `/jucarii-stem`, `/categories/coding-robotics`, `/jucarii-stem-dupa-varsta` | homepage, pagini nationale, alte orase |
| jucarii educative copii | comercial larg | `/jucarii-educative` | `/products`, `/jucarii-stem`, `/beneficiile-jucariilor-stem` | homepage, produse, blog |

## Implementat in acest rollout

### Fundatie SEO
- Curatat metadata si schema de pe homepage si din shared schema utilities.
- Eliminat claim-uri neverificate despre volum, performanta, certificari sau aprobari.
- Corectat `robots` pentru `sitemap.xml`.
- Extins sitemap-ul cu produse, bloguri si categorii dinamice indexabile.

### Pagini comerciale
- Extins template-ul `CommercialLandingPage` cu:
  - rezumat comercial
  - ghid de selectie
  - checklist de cumparare
- Imbogatite paginile:
  - `/jucarii-stem`
  - `/jucarii-educative`
  - `/jucarii-inteligente`
  - `/robotica-pentru-copii`
  - `/jucarii-stem/[city]`

### Categorii comerciale
- Rescris titlurile si descrierile pentru:
  - `/categories/coding-robotics`
  - `/categories/science-experiments`
  - `/categories/magnetic-building`
- Inlocuit sectiunile placeholder de tip video cu copy comercial util si linkuri interne reale.
- Localizat metadata pentru `/categories`.

### Trust si topical authority
- Curatat `/about` de claim-uri numerice si promise exagerate.
- Ajustat ghidul STEM principal astfel incat sa sustina autoritatea fara certificari sau aprobari inventate.

### Sistem SEO pentru produse
- Imbunatatit pattern-ul de metadata pentru produse.
- Eliminat duplicarea inutila a structured data dintre metadata si pagina de produs.
- Adaugat FAQ generat automat pentru produse fara FAQ editorial, folosit atat vizibil, cat si in schema.

## URL-uri de cerut la indexare primele
- `/`
- `/products`
- `/jucarii-stem`
- `/jucarii-educative`
- `/jucarii-inteligente`
- `/robotica-pentru-copii`
- `/categories/science-experiments`
- `/categories/coding-robotics`
- `/categories/magnetic-building`
- `/jucarii-stem/bucuresti`
- `/jucarii-stem/cluj-napoca`
- `/about`
- `/ghid-educatie-stem-romania`

## Pagini cu sanse bune de castig rapid
- `/jucarii-stem`
- `/jucarii-educative`
- `/robotica-pentru-copii`
- `/categories/science-experiments`
- `/jucarii-stem/bucuresti`
- `/jucarii-stem/cluj-napoca`

## Pagini care au nevoie de inca un strat de continut / linkuri
- `/products`
  - are nevoie de copy comercial vizibil mai puternic si facete indexabile controlate.
- produse individuale cu descrieri slabe
  - au nevoie de completare editoriala si mai multa distinctie intre produse similare.
- blogul principal
  - are nevoie de mapare mai agresiva a articolelor catre money pages.

## Checklist Search Console
- Verifica indexarea pentru toate URL-urile din lista prioritara.
- Verifica daca `/sitemap.xml` este citit corect dupa redeploy.
- Urmareste query-urile:
  - `jucarii stem`
  - `jucarii educative`
  - `jucarii inteligente`
  - `robotica pentru copii`
  - `experimente stiintifice copii`
  - `jucarii stem bucuresti`
  - `jucarii stem cluj`
- Verifica daca homepage-ul si `/products` nu mai afiseaza titluri vechi in SERP.
- Urmareste CTR separat pentru paginile comerciale principale.

## Inspectie saptamanala
- Query growth pe clustere comerciale principale.
- CTR pe homepage, `/products` si cele 4 landing pages.
- Index coverage pentru produse noi si pagini regionale.
- Paginile cu impresii multe si CTR sub asteptari.
- Paginile cu clicks dar pozitie medie 8-20 care merita continut/linkuri suplimentare.
- URL-uri cu `Crawled - currently not indexed`.

## Roadmap 30 zile

### Saptamana 1
- Cere indexare pentru URL-urile prioritare.
- Verifica randarea JSON-LD si canonicals pentru paginile comerciale si produse.
- Extrage primele 20 produse cu cele mai multe impresii si rescrie descrierile daca sunt slabe.

### Saptamana 2
- Extinde sistemul pentru pagini noi:
  - `jucarii educative pentru 3-5 ani`
  - `jucarii educative pentru 6-8 ani`
  - `jucarii pentru dezvoltarea logicii`
  - `cadouri educative pentru copii`
- Leaga fiecare pagina noua de un cluster comercial existent, nu publica continut izolat.

### Saptamana 3
- Adauga bloc editorial vizibil pe `/products` pentru selectie dupa intentie.
- Imbunatateste descrierile produselor cu:
  - pentru ce varsta sunt bune
  - ce tip de joaca sustin
  - catre ce pagina comerciala duc mai departe

### Saptamana 4
- Analizeaza CTR pentru paginile comerciale principale si testeaza 2-3 variante de title/meta.
- Construieste 3-5 articole suport care imping explicit spre:
  - `/jucarii-stem`
  - `/robotica-pentru-copii`
  - `/categories/science-experiments`
