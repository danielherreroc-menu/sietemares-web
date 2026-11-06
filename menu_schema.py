#!/usr/bin/env python3
"""
menu_schema.py -- genera el JSON-LD (schema.org Menu > MenuSection > MenuItem)
a partir del HTML YA RENDERIZADO de una página de carta.

Por qué así: lee lo mismo que ve el cliente (nombre, descripción y precio de
cada plato), así el schema nunca se desalinea de la carta. Funciona con
cualquier generador del grupo: solo necesita que cada plato sea un
<article class="menu-item"> con un <h3> (nombre), un elemento con clase
"menu-price" (precio) y opcionalmente un <p> (descripción). Las secciones
salen de los <h2> y las subsecciones de los <h3 class="menu-subhead">.

Uso desde un generador (después de regenerar el HTML y antes de escribir):

    from menu_schema import apply_menu_schema
    html = apply_menu_schema(html, menu_id=..., name=..., url=..., provider_id=...)

El bloque se escribe entre <!-- MENU-SCHEMA --> y <!-- /MENU-SCHEMA --> justo
antes de </head>; si ya existe, se reemplaza. Todo lo demás queda igual.

También se puede correr a mano:
    python3 menu_schema.py carta/index.html MENU_ID NOMBRE URL PROVIDER_ID
Solo usa la librería estándar.
"""
import json
import re
import sys
from collections import OrderedDict
from html.parser import HTMLParser

START = "<!-- MENU-SCHEMA -->"
END = "<!-- /MENU-SCHEMA -->"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


class _MenuParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.stack = []            # tags abiertos dentro del <article> actual
        self.capture = None        # 'h2' | 'sub' | 'name' | 'price' | 'desc'
        self.buf = []
        self.sections = OrderedDict()   # h2 -> {"items": [], "subs": OrderedDict()}
        self.cur_section = None
        self.cur_sub = None
        self.item = None
        self.item_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get("class") or "").split()
        if tag == "main":
            self.in_main = True
        if not self.in_main:
            return
        if self.item is not None:
            if tag not in VOID:
                self.item_depth += 1
            if self.capture is None:
                if tag == "h3" and not self.item.get("name"):
                    self.capture, self.buf = "name", []
                elif "menu-price" in cls and not self.item.get("price"):
                    self.capture, self.buf = "price", []
                    self._cap_depth = self.item_depth
                elif tag == "p" and not self.item.get("desc"):
                    self.capture, self.buf = "desc", []
            return
        if tag == "article" and "menu-item" in cls:
            self.item = {}
            self.item_depth = 1
            return
        if tag == "h2" and self.capture is None:
            self.capture, self.buf = "h2", []
        elif tag == "h3" and "menu-subhead" in cls and self.capture is None:
            self.capture, self.buf = "sub", []

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_main = False
            return
        if not self.in_main:
            return
        if self.item is not None:
            if self.capture == "name" and tag == "h3":
                self.item["name"] = self._text()
            elif self.capture == "desc" and tag == "p":
                self.item["desc"] = self._text()
            elif self.capture == "price" and self.item_depth == self._cap_depth:
                self.item["price"] = self._text()
            if tag not in VOID:
                self.item_depth -= 1
            if self.item_depth == 0:
                self._push_item()
                self.item = None
            return
        if self.capture == "h2" and tag == "h2":
            self.cur_section = self._text()
            self.cur_sub = None
        elif self.capture == "sub" and tag == "h3":
            self.cur_sub = self._text()

    def handle_data(self, data):
        if self.capture:
            self.buf.append(data)

    def _text(self):
        t = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        self.capture, self.buf = None, []
        return t

    def _push_item(self):
        if not self.item.get("name") or not self.cur_section:
            return
        sec = self.sections.setdefault(self.cur_section, {"items": [], "subs": OrderedDict()})
        if self.cur_sub:
            sec["subs"].setdefault(self.cur_sub, []).append(self.item)
        else:
            sec["items"].append(self.item)


def _offers(price):
    """'$5.5' -> Offer 5.50 USD; '8 / 16' -> dos Offers; '+1' o texto -> None."""
    p = (price or "").replace("$", "").replace("B/.", "").strip()
    if not p:
        return None
    parts = [x.strip() for x in p.split("/")]
    if not all(re.fullmatch(r"\d+(?:[.,]\d+)?", x) for x in parts):
        return None
    offers = [{"@type": "Offer", "price": "%.2f" % float(x.replace(",", ".")), "priceCurrency": "USD"} for x in parts]
    return offers[0] if len(offers) == 1 else offers


def _menu_item(it):
    o = {"@type": "MenuItem", "name": it["name"]}
    if it.get("desc"):
        o["description"] = it["desc"]
    off = _offers(it.get("price"))
    if off:
        o["offers"] = off
    return o


def build_menu_schema(html_text, menu_id, name, url, provider_id, in_language="es-PA"):
    p = _MenuParser()
    p.feed(html_text)
    sections = []
    total = 0
    for sec_name, sec in p.sections.items():
        node = {"@type": "MenuSection", "name": sec_name}
        if sec["items"]:
            node["hasMenuItem"] = [_menu_item(i) for i in sec["items"]]
            total += len(sec["items"])
        if sec["subs"]:
            node["hasMenuSection"] = [
                {"@type": "MenuSection", "name": sub, "hasMenuItem": [_menu_item(i) for i in items]}
                for sub, items in sec["subs"].items()
            ]
            total += sum(len(v) for v in sec["subs"].values())
        if "hasMenuItem" in node or "hasMenuSection" in node:
            sections.append(node)
    menu = {
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": menu_id,
        "name": name,
        "url": url,
        "inLanguage": in_language,
        "provider": {"@id": provider_id},
        "hasMenuSection": sections,
    }
    return menu, total


def apply_menu_schema(html_text, menu_id, name, url, provider_id, min_items=5):
    menu, total = build_menu_schema(html_text, menu_id, name, url, provider_id)
    if total < min_items:
        # Algo raro en el HTML: mejor no tocar nada que publicar un schema vacío.
        print(f"AVISO menu_schema: solo {total} platos en {url}; no se modifica el schema", file=sys.stderr)
        return html_text
    payload = json.dumps(menu, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    block = f'{START}<script type="application/ld+json">{payload}</script>{END}'
    pat = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
    if pat.search(html_text):
        return pat.sub(lambda m: block, html_text, count=1)
    i = html_text.find("</head>")
    if i == -1:
        return html_text
    return html_text[:i] + block + "\n" + html_text[i:]


if __name__ == "__main__":
    if len(sys.argv) != 6:
        print(__doc__)
        sys.exit(1)
    path, menu_id, name, url, provider = sys.argv[1:]
    with open(path, encoding="utf-8") as f:
        src = f.read()
    out = apply_menu_schema(src, menu_id, name, url, provider)
    m, n = build_menu_schema(src, menu_id, name, url, provider)
    if out != src:
        with open(path, "w", encoding="utf-8") as f:
            f.write(out)
    print(f"{path}: {n} platos, {len(m['hasMenuSection'])} secciones")
