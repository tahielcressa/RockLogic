# -*- coding: utf-8 -*-
"""Genera la presentacion comercial de RockLogic (16:9, formal, slate + amber)."""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "assets")
DIAGS = os.path.join(BASE, "diagrams")

SLATE   = RGBColor.from_string("0F172A")
SLATE2  = RGBColor.from_string("1E293B")
SLATE3  = RGBColor.from_string("334155")
GRAY    = RGBColor.from_string("64748B")
LIGHT   = RGBColor.from_string("F8FAFC")
WHITE   = RGBColor.from_string("FFFFFF")
AMBER   = RGBColor.from_string("F59E0B")
AMBER2  = RGBColor.from_string("B45309")
BORDER  = RGBColor.from_string("E2E8F0")
INHERIT = None

FONT = "Segoe UI"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]


def _no_autofit(shape):
    if shape is None:
        return
    try:
        shape.text_frame.word_wrap = True
    except Exception:
        pass


def add_slide():
    return prs.slides.add_slide(BLANK)


def rect(slide, x, y, w, h, fill, line=None, line_w=0.75, rounded=False, radius=0.12, shadow=False):
    shp = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE, x, y, w, h)
    if rounded:
        try:
            shp.adjustments[0] = radius
        except Exception:
            pass
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(line_w)
    shp.shadow.inherit = False
    return shp


def txt(slide, x, y, w, h, paras, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.0, space_after=6, wrap=True):
    """paras: list of dicts or list-of-(runs). Each para: {'runs':[(text,size,bold,color,italic)], 'align':..., 'space_before':..}"""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = wrap
    tf.vertical_anchor = anchor
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    for i, p in enumerate(paras):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = p.get("align", align)
        para.space_after = Pt(p.get("space_after", space_after))
        para.space_before = Pt(p.get("space_before", 0))
        try:
            para.line_spacing = p.get("spacing", spacing)
        except Exception:
            pass
        for r in p["runs"]:
            run = para.add_run()
            run.text = r[0]
            f = run.font
            f.name = r[4] if len(r) > 4 and isinstance(r[4], str) and r[4] else FONT
            f.size = Pt(r[1])
            f.bold = r[2]
            f.color.rgb = r[3] if len(r) > 3 and r[3] else SLATE
            f.italic = r[5] if len(r) > 5 else False
    return tb


def header(slide, kicker, title, page):
    rect(slide, 0, 0, prs.slide_width, Inches(0.12), AMBER)
    rect(slide, Inches(0.6), Inches(0.55), Inches(0.10), Inches(0.55), AMBER)
    txt(slide, Inches(0.9), Inches(0.42), Inches(11.5), Inches(0.3),
        [{"runs": [(kicker, 12, True, AMBER2)]}], spacing=1.0)
    txt(slide, Inches(0.9), Inches(0.72), Inches(11.9), Inches(0.8),
        [{"runs": [(title, 30, True, SLATE)]}], spacing=1.0)
    footer(slide, page)


def footer(slide, page):
    r = rect(slide, Inches(0.6), Inches(7.06), Inches(1.7), Inches(0.3), None)
    txt(slide, Inches(0.6), Inches(7.08), Inches(10), Inches(0.3),
        [{"runs": [("RockLogic", 10, True, SLATE2), ("   ·   Confidencial", 10, False, GRAY)]}])
    txt(slide, Inches(12.0), Inches(7.08), Inches(0.8), Inches(0.3),
        [{"runs": [(str(page), 10, False, GRAY)], "align": PP_ALIGN.RIGHT}])


def bullet(slide, x, y, w, h, items, size=16, gap=10, color=SLATE, marker_color=AMBER, weight=True):
    paras = []
    for it in items:
        if isinstance(it, tuple):
            txtp, sz = it
        else:
            txtp, sz = it, size
        paras.append({
            "runs": [("•  ", sz, True, marker_color), (txtp, sz, weight, color)],
            "space_after": gap, "spacing": 1.05,
        })
    return txt(slide, x, y, w, h, paras)


def chip(slide, x, y, w, h, text, fill=SLATE2, color=WHITE, size=11, bold=True):
    c = rect(slide, x, y, w, h, fill, rounded=True, radius=0.5)
    tf = c.text_frame
    tf.word_wrap = False
    tf.margin_left = Emu(0); tf.margin_right = Emu(0)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = text
    r.font.name = FONT; r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color
    return c


def pic_fit(slide, path, x, y, w, h):
    from PIL import Image
    im = Image.open(path)
    iw, ih = im.size
    ar = iw / ih
    box_ar = w / h
    if ar > box_ar:
        nw = w; nh = int(w / ar)
    else:
        nh = h; nw = int(h * ar)
    nx = x + (w - nw) // 2
    ny = y + (h - nh) // 2
    slide.shapes.add_picture(path, nx, ny, width=nw, height=nh)


def kpi_card(slide, x, y, w, h, value, label, sub):
    card = rect(slide, x, y, w, h, WHITE, line=BORDER, line_w=1.0, rounded=True, radius=0.10)
    txt(slide, x + Inches(0.25), y + Inches(0.25), w - Inches(0.5), Inches(0.9),
        [{"runs": [(value, 30, True, AMBER2)]}])
    txt(slide, x + Inches(0.25), y + Inches(1.15), w - Inches(0.5), Inches(0.4),
        [{"runs": [(label, 14, True, SLATE)]}])
    txt(slide, x + Inches(0.25), y + Inches(1.55), w - Inches(0.5), Inches(0.5),
        [{"runs": [(sub, 11, False, GRAY)]}], spacing=1.0)


# ============================================================ 1. PORTADA
s = add_slide()
rect(s, 0, 0, prs.slide_width, prs.slide_height, SLATE)
rect(s, 0, 0, prs.slide_width, Inches(0.16), AMBER)
rect(s, Inches(12.2), Inches(1.0), Inches(0.9), Inches(0.06), AMBER)
rect(s, Inches(1.0), Inches(1.4), Inches(0.55), Inches(0.55), AMBER, rounded=True, radius=0.25)
txt(s, Inches(1.0), Inches(1.46), Inches(0.55), Inches(0.42),
    [{"runs": [("R", 24, True, SLATE)], "align": PP_ALIGN.CENTER}])
txt(s, Inches(1.75), Inches(1.5), Inches(6), Inches(0.4),
    [{"runs": [("RockLogic", 22, True, WHITE)]}])
txt(s, Inches(1.0), Inches(2.5), Inches(11.3), Inches(1.6),
    [{"runs": [("Digitalización y trazabilidad ", 40, True, WHITE)],
      "space_after": 2},
     {"runs": [("para operaciones mineras", 40, True, AMBER)], "space_after": 14,
      "space_before": 0}])
txt(s, Inches(1.0), Inches(4.15), Inches(11.3), Inches(0.9),
    [{"runs": [("De la planilla al reporte ejecutivo en minutos: una plataforma moderna — web y de escritorio — "
                "que centraliza, procesa y hace visibles los datos de producción minera.", 17, False, RGBColor.from_string("CBD5E1"))],
      "spacing": 1.15}])
rect(s, Inches(1.0), Inches(5.9), Inches(6.6), Inches(0.015), RGBColor.from_string("334155"))
txt(s, Inches(1.0), Inches(6.15), Inches(11,), Inches(0.8),
    [{"runs": [("Propuesta comercial   ·   Preparada para: Minera Andina / Minera del Sur", 13, True, WHITE)],
      "space_after": 2},
     {"runs": [("Octubre 2026   ·   Documento confidencial   ·   v1.0", 11, False, GRAY)]}])
txt(s, Inches(1.0), Inches(6.9), Inches(11), Inches(0.3),
    [{"runs": [("RockLogic", 11, True, AMBER)], "align": PP_ALIGN.RIGHT}])

# ============================================================ 2. AGENDA
s = add_slide()
header(s, "ÍNDICE", "Qué vamos a ver", 2)
agenda = [
    ("01", "El desafío", "Dónde estamos parados y qué fricciones existen hoy"),
    ("02", "La solución", "RockLogic y sus tres frentes: web, escritorio y servidor central"),
    ("03", "Beneficios", "Qué cambia en el día a día y en el cierre de reportes"),
    ("04", "Demostración", "Recorrido real por el producto con datos de producción"),
    ("05", "Seguridad", "Roles, aislamiento por empresa y trazabilidad completa"),
    ("06", "Plan de trabajo", "Implementación, acompañamiento y próximos pasos"),
]
y = Inches(1.7)
for num, t, d in agenda:
    rect(s, Inches(0.9), y, Inches(0.62), Inches(0.62), SLATE, rounded=True, radius=0.18)
    txt(s, Inches(0.9), y + Inches(0.10), Inches(0.62), Inches(0.5),
        [{"runs": [(num, 16, True, AMBER)], "align": PP_ALIGN.CENTER}])
    txt(s, Inches(1.75), y - Inches(0.03), Inches(7.5), Inches(0.4),
        [{"runs": [(t, 16, True, SLATE)]}])
    txt(s, Inches(1.75), y + Inches(0.30), Inches(10.5), Inches(0.3),
        [{"runs": [(d, 11.5, False, GRAY)]}])
    y += Inches(0.88)

# ============================================================ 3. EL DESAFÍO
s = add_slide()
header(s, "EL DESAFÍO", "Hoy, los datos de producción valen menos de lo que podrían", 3)
txt(s, Inches(0.9), Inches(1.72), Inches(11.5), Inches(0.5),
    [{"runs": [("Las operaciones mineras generan información constante — pero buena parte se procesa ",
                16, False, SLATE, FONT, False),
               ("a mano y en planillas aisladas.", 16, True, SLATE2)]}], spacing=1.15)
bullet(s, Inches(0.9), Inches(2.55), Inches(11.6), Inches(2.6), [
    ("Datos dispersos: cada turno o zona registra en su propio archivo, sin una fuente única.", 14.5),
    ("Reportes tardíos y manuales: consolidar la producción lleva horas, y con riesgo de error.", 14.5),
    ("Sin trazabilidad: no se puede rastrear de dónde salió un número ni quién lo cargó.", 14.5),
    ("Cero visión multicapa: zona, estado y equipo no se cruzan en un mismo tablero.", 14.5),
    ("Información que no llega a tiempo a quienes toman decisiones.", 14.5),
], size=14.5, gap=8)
rect(s, Inches(0.9), Inches(5.3), Inches(11.5), Inches(1.35), LIGHT, line=BORDER, rounded=True, radius=0.10)
txt(s, Inches(1.2), Inches(5.52), Inches(10.9), Inches(0.9),
    [{"runs": [("¿Cuánto cuesta eso?  ", 14, True, AMBER2),
               ("Más tiempo operativo, decisiones sobre datos viejos y auditorías que no pueden reconstruirse.", 14, True, SLATE)],
      "spacing": 1.15}])

# ============================================================ 4. LA SOLUCIÓN
s = add_slide()
header(s, "LA SOLUCIÓN", "RockLogic: una plataforma, dos frentes, un solo sistema", 4)
sol = [
    ("Aplicación Web", "Acceso desde el navegador: tablero de KPIs, carga de archivos, historial y administración. Sin instalación.", "Web"),
    ("Aplicación de Escritorio", "Cliente nativo de Windows para trabajo intensivo: mismas capacidades, flujo optimizado y conexión directa al servidor.", "Desktop"),
    ("Servidor central", "API REST Spring Boot: autenticación, procesamiento de archivos, reportes y administración de usuarios y equipos.", "API"),
]
x = Inches(0.9)
for t, d, k in sol:
    card = rect(s, x, Inches(1.85), Inches(3.75), Inches(3.6), WHITE, line=BORDER, rounded=True, radius=0.10)
    chip(s, x + Inches(0.3), Inches(2.2), Inches(1.15), Inches(0.4), k, fill=SLATE2, color=AMBER)
    txt(s, x + Inches(0.3), Inches(2.8), Inches(3.15), Inches(0.7),
        [{"runs": [(t, 16, True, SLATE)]}], spacing=1.0)
    txt(s, x + Inches(0.3), Inches(3.45), Inches(3.15), Inches(1.7),
        [{"runs": [(d, 12.5, False, GRAY)]}], spacing=1.12)
    x += Inches(3.95)
rect(s, Inches(0.9), Inches(5.75), Inches(11.5), Inches(1.0), SLATE, rounded=True, radius=0.12)
txt(s, Inches(1.2), Inches(5.97), Inches(10.9), Inches(0.55),
    [{"runs": [("Un único backend:  ", 14, True, AMBER),
               ("web y escritorio consumen la misma API. Misma información, misma seguridad, sin duplicación de datos.", 14, True, WHITE)],
      "spacing": 1.1}])

# ============================================================ 5. ANTES / DESPUÉS
s = add_slide()
header(s, "EL CAMBIO", "Qué cambia al poner a trabajar a RockLogic", 5)
rows = [
    ("Consolidación de producciones y equipos", "Planillas locales, unión manual, horas de trabajo", "Carga única y procesamiento automático"),
    ("Reportes", "Cierre de turno/periodo contra reloj, con riesgo de error", "Reporte en minutos, con el detalle por zona y estado"),
    ("Errores de carga", "Detectados después, cuando el dato ya viajó", "Validación al instante, antes de procesar"),
    ("Trazabilidad", "Inexistente: no se puede reconstruir una corrida", "Historial completo con estado y log de cada ejecución"),
    ("Visión de gestión", "Números sueltos, sin cruces", "KPIs, gráficos por zona y estado, tablero único"),
]
tbl = s.shapes.add_table(len(rows) + 1, 3, Inches(0.9), Inches(1.7), Inches(11.5), Inches(4.6)).table
tbl.columns[0].width = Inches(3.5)
tbl.columns[1].width = Inches(4.0)
tbl.columns[2].width = Inches(4.0)
head = ["Dimensión", "Hoy (sin sistema)", "Con RockLogic"]
for j, h in enumerate(head):
    c = tbl.cell(0, j)
    c.fill.solid(); c.fill.fore_color.rgb = SLATE
    c.text_frame.word_wrap = True
    p = c.text_frame.paragraphs[0]; r = p.add_run(); r.text = h
    r.font.name = FONT; r.font.size = Pt(13); r.font.bold = True; r.font.color.rgb = WHITE
for i, (a, b, cc) in enumerate(rows, start=1):
    for j, val in enumerate((a, b, cc)):
        c = tbl.cell(i, j)
        c.fill.solid()
        c.fill.fore_color.rgb = WHITE if i % 2 == 1 else LIGHT
        c.text_frame.word_wrap = True
        p = c.text_frame.paragraphs[0]
        r = p.add_run(); r.text = val
        r.font.name = FONT; r.font.size = Pt(12)
        r.font.bold = (j == 2)
        r.font.color.rgb = SLATE2 if j != 2 else RGBColor.from_string("0F766E")
        if j == 2:
            r.font.color.rgb = B45309 if False else RGBColor.from_string("047857")
footer(s, 5)

# ============================================================ 6. BENEFICIOS
s = add_slide()
header(s, "BENEFICIOS", "Resultados que se ven en el cierre del turno", 6)
kpis = [
    ("-70%", "Tiempo de consolidación", "de horas a minutos por reporte"),
    ("100%", "Trazabilidad", "cada corrida con estado y log"),
    ("1 fuente", "Única de verdad", "web y escritorio sobre la misma API"),
    ("0 reprocesos", "Datos validados", "errores detectados antes de procesar"),
]
x = Inches(0.9)
for _k in kpis:
    kpi_card(s, x, Inches(1.8), Inches(2.78), Inches(2.35), _k[0], _k[1], _k[2])
    x += Inches(2.94)
kpi_card(s, Inches(9.48), Inches(1.8), Inches(2.98), Inches(2.35), "WEB + DESK", "Dos frentes", "un solo sistema central")
rect(s, Inches(0.9), Inches(4.55), Inches(11.55), Inches(2.2), LIGHT, line=BORDER, rounded=True, radius=0.10)
txt(s, Inches(1.2), Inches(4.8), Inches(11,), Inches(0.4),
    [{"runs": [("Valor plano y simple para la mesa:  ", 13, True, SLATE2)],
      "space_after": 8}])
bullet(s, Inches(1.2), Inches(5.25), Inches(10.9), Inches(1.6), [
    ("Menos horas administrativas por turno y más tiempo en la operación.", 13),
    ("Reportes limpios y auditable s, listos para dirección y para la casa matriz.", 13),
    ("Adopción rápida: la carga sigue siendo por archivo, como ya trabajan hoy.", 13),
], size=13, gap=7)

# ============================================================ 7. DEMO: ACCESO
s = add_slide()
header(s, "DEMOSTRACIÓN · 01", "Acceso seguro y credenciales por rol", 7)
pic = os.path.join(ASSETS, "1-login.png")
if os.path.exists(pic):
    rect(s, Inches(0.9), Inches(1.65), Inches(8.1), Inches(5.1), None, line=BORDER, line_w=1.0)
    pic_fit(s, pic, Inches(0.95), Inches(1.7), Inches(8.0), Inches(5.0))
bullet(s, Inches(9.3), Inches(2.1), Inches(3.4), Inches(4.0), [
    ("Login único con email y contraseña.", 13.5),
    ("Sesión protegida por token (JWT) en toda la API.", 13.5),
    ("Roles distintos: Administrador gestiona; Operador carga y consulta.", 13.5),
    ("Accesos de demostración listos en pantalla para probar.", 13.5),
], size=13.5, gap=9)

# ============================================================ 8. DEMO: DASHBOARD
s = add_slide()
header(s, "DEMOSTRACIÓN · 02", "Tablero ejecutivo: KPIs y gráficos al instante", 8)
pic = os.path.join(ASSETS, "2-dashboard.png")
if os.path.exists(pic):
    rect(s, Inches(0.9), Inches(1.65), Inches(8.5), Inches(5.1), None, line=BORDER, line_w=1.0)
    pic_fit(s, pic, Inches(0.95), Inches(1.7), Inches(8.4), Inches(5.0))
bullet(s, Inches(9.75), Inches(2.1), Inches(2.9), Inches(4.0), [
    ("Cinco KPIs de producción en una sola vista.", 12.5),
    ("Producción por zona (barras) y por estado (donut).", 12.5),
    ("Últimas corridas con su resultado.", 12.5),
    ("Todo actualizado sobre los datos reales cargados.", 12.5),
], size=12.5, gap=9)

# ============================================================ 9. DEMO: CARGA
s = add_slide()
header(s, "DEMOSTRACIÓN · 03", "Carga y procesamiento: validado al instante", 9)
pic = os.path.join(ASSETS, "3-cargar.png")
if os.path.exists(pic):
    rect(s, Inches(0.9), Inches(1.65), Inches(8.5), Inches(5.1), None, line=BORDER, line_w=1.0)
    pic_fit(s, pic, Inches(0.95), Inches(1.7), Inches(8.4), Inches(5.0))
bullet(s, Inches(9.75), Inches(2.1), Inches(2.9), Inches(4.0), [
    ("Asistente de 3 pasos: subir → procesar → descargar.", 12.5),
    ("Acepta CSV, XLSX y XLS.", 12.5),
    ("Ensayos de formato detectados al subir.", 12.5),
    ("Resultado claro: métricas y log detallado del procesamiento.", 12.5),
], size=12.5, gap=9)

# ============================================================ 10. DEMO: HISTORIAL
s = add_slide()
header(s, "DEMOSTRACIÓN · 04", "Historial, búsqueda y trazabilidad completa", 10)
pic = os.path.join(ASSETS, "4-historial.png")
if os.path.exists(pic):
    rect(s, Inches(0.9), Inches(1.65), Inches(8.5), Inches(5.1), None, line=BORDER, line_w=1.0)
    pic_fit(s, pic, Inches(0.95), Inches(1.7), Inches(8.4), Inches(5.0))
bullet(s, Inches(9.75), Inches(2.1), Inches(2.9), Inches(4.0), [
    ("Todas las corridas con fecha, archivo y estado.", 12.5),
    ("Filtros por estado OK / ERROR y búsqueda.", 12.5),
    ("Log expandible de cada ejecución.", 12.5),
    ("Re-descarga del reporte en un clic.", 12.5),
], size=12.5, gap=9)

# ============================================================ 11. ADMIN: USUARIOS
s = add_slide()
header(s, "DEMOSTRACIÓN · 05", "Administración: usuarios, equipos y empresas", 11)
pic = os.path.join(ASSETS, "5-usuarios.png")
if os.path.exists(pic):
    rect(s, Inches(0.9), Inches(1.65), Inches(8.5), Inches(5.1), None, line=BORDER, line_w=1.0)
    pic_fit(s, pic, Inches(0.95), Inches(1.7), Inches(8.4), Inches(5.0))
bullet(s, Inches(9.75), Inches(2.1), Inches(2.9), Inches(4.0), [
    ("Gestión de usuarios por empresa.", 12.5),
    ("Catálogo de equipos/zonas configurable.", 12.5),
    ("Datos de la compañía editables.", 12.5),
    ("Preparado para escala multiempresa.", 12.5),
], size=12.5, gap=9)

# ============================================================ 12. RECORRIDO SISTEMA
s = add_slide()
header(s, "CÓMO FUNCIONA", "El recorrido completo, a nivel sistema", 12)
pic = os.path.join(DIAGS, "recorrido-sistema.png")
if os.path.exists(pic):
    rect(s, Inches(0.9), Inches(1.62), Inches(11.55), Inches(5.15), WHITE, line=BORDER, line_w=1.0)
    pic_fit(s, pic, Inches(1.0), Inches(1.72), Inches(11.35), Inches(4.95))

# ============================================================ 13. SEGURIDAD
s = add_slide()
header(s, "SEGURIDAD Y GOBIERNO", "Control sobre quién ve qué, y qué se grba en el sistema", 13)
cards = [
    ("Autenticación", "Login único, sesión con token JWT en cada llamada a la API. Sin tokens a la vista, sin sesiones abiertas de más."),
    ("Roles y permisos", "Administrador y Operador con capacidades claras: admin gestiona usuarios y equipos; operador carga y consulta."),
    ("Aislamiento por empresa", "Cada compañía (Minera Andina, Minera del Sur…) solo accesa a sus propios datos. La plataforma crece sin mezclar información."),
    ("Trazabilidad", "Cada corrida de procesamiento queda registrada con su estado y log: se puede saber qué pasó, cuándo y con qué archivo."),
]
x = Inches(0.9)
y = Inches(1.85)
for t, d in cards:
    rect(s, x, y, Inches(5.65), Inches(2.15), WHITE, line=BORDER, rounded=True, radius=0.10)
    txt(s, x + Inches(0.3), y + Inches(0.25), Inches(5.0), Inches(0.4),
        [{"runs": [(t, 15, True, SLATE)]}])
    txt(s, x + Inches(0.3), y + Inches(0.75), Inches(5.05), Inches(1.3),
        [{"runs": [(d, 12, False, GRAY)]}], spacing=1.1)
    if x < Inches(4):
        x += Inches(5.85)
    else:
        x = Inches(0.9); y += Inches(2.35)
rect(s, Inches(0.9), Inches(6.5), Inches(11.55), Inches(0.62), LIGHT, line=BORDER, rounded=True, radius=0.5)
txt(s, Inches(0.9), Inches(6.62), Inches(11.55), Inches(0.4),
    [{"runs": [("Al ser un MVP demostrable, la plataforma queda lista para sumar auditoría avanzada, cifrado en reposo y SSO bajo estándares empresariales.", 11.5, False, SLATE3)],
      "align": PP_ALIGN.CENTER}])

# ============================================================ 14. ROADMAP
s = add_slide()
header(s, "PLAN DE TRABAJO", "De la demostración al valor operativo", 14)
fases = [
    ("Fase 1 · Hoy", "Prueba real del MVP con datos del cliente: login, carga, tablero, historial, usuarios.", AMBER2),
    ("Fase 2 · Primer mes", "Conexión al modelo real de producción y ajuste de métricas y reportes.", SLATE2),
    ("Fase 3 · Trimestre 1", "Más formatos de archivo, alertas, reportes periódicos y exportaciones avanzadas.", SLATE2),
    ("Fase 4 · Semestre", "Multiusuario a escala, panel de dirección, auditoría corporativa y SSO.", SLATE),
]
y = Inches(1.85)
for t, d, col in fases:
    rect(s, Inches(0.9), y, Inches(0.16), Inches(1.35), col)
    txt(s, Inches(1.25), y - Inches(0.02), Inches(4.2), Inches(0.5),
        [{"runs": [(t, 15, True, SLATE)]}])
    txt(s, Inches(1.25), y + Inches(0.42), Inches(11.0), Inches(0.9),
        [{"runs": [(d, 12.5, False, GRAY)]}], spacing=1.1)
    y += Inches(1.42)

# ============================================================ 15. ACOMPAÑAMIENTO
s = add_slide()
header(s, "ACOMPAÑAMIENTO", "No te entregamos un sistema: te acompañamos a usarlo", 15)
acc = [
    ("Demostración guiada", "Recorremos el producto con los datos reales de la operación, en la web y en el escritorio."),
    ("Capacitación", "Formación para administradores y operadores, con material en español y roles bien definidos."),
    ("Soporte inicial", "Acompañamiento en el primer mes de uso, corrección de ajustes y mejoras de reportes."),
    ("Mejora continua", "Nuevas versiones sobre la misma base: feedback de operación en features del roadmap."),
]
x = Inches(0.9)
y = Inches(1.85)
for t, d in acc:
    rect(s, x, y, Inches(5.65), Inches(2.15), WHITE, line=BORDER, rounded=True, radius=0.10)
    chip(s, x + Inches(0.3), y + Inches(0.3), Inches(0.9), Inches(0.34), "SÍ", fill=AMBER, color=SLATE, size=10)
    txt(s, x + Inches(0.3), y + Inches(0.8), Inches(5.0), Inches(0.4),
        [{"runs": [(t, 15, True, SLATE)]}])
    txt(s, x + Inches(0.3), y + Inches(1.25), Inches(5.05), Inches(0.85),
        [{"runs": [(d, 12, False, GRAY)]}], spacing=1.1)
    if x < Inches(4):
        x += Inches(5.85)
    else:
        x = Inches(0.9); y += Inches(2.35)

# ============================================================ 16. CIERRE
s = add_slide()
rect(s, 0, 0, prs.slide_width, prs.slide_height, SLATE)
rect(s, 0, 0, prs.slide_width, Inches(0.16), AMBER)
txt(s, Inches(1.0), Inches(2.1), Inches(11.3), Inches(1.2),
    [{"runs": [("Demos que funcione hoy, ", 36, True, WHITE)],
      "space_after": 2},
     {"runs": [("y crezca con ustedes.", 36, True, AMBER)]}])
txt(s, Inches(1.0), Inches(3.5), Inches(11.3), Inches(0.9),
    [{"runs": [("Estamos listos para demostrar RockLogic con sus propios datos y planificar juntos la implementación.",
                16, False, RGBColor.from_string("CBD5E1"))],
      "spacing": 1.15}])
rect(s, Inches(1.0), Inches(4.7), Inches(6.5), Inches(0.015), RGBColor.from_string("334155"))
txt(s, Inches(1.0), Inches(5.0), Inches(11), Inches(1.2),
    [{"runs": [("RockLogic", 18, True, AMBER)], "space_after": 6},
     {"runs": [("Desarrollo, video y producto · demo lista para minera andina y minera del sur", 12, False, GRAY)]}])
txt(s, Inches(1.0), Inches(6.7), Inches(11), Inches(0.4),
    [{"runs": [("Gracias — quedo a disposición para la próxima demostración en vivo.", 12, True, WHITE)]}])
rect(s, Inches(11.0), Inches(1.0), Inches(1.35), Inches(0.06), AMBER)

OUT = os.path.join(BASE, "RockLogic-presentacion-comercial.pptx")
prs.save(OUT)
print("OK ->", OUT, os.path.getsize(OUT), "bytes")