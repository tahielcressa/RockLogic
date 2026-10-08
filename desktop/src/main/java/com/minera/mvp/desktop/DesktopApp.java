package com.minera.mvp.desktop;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.CategoryAxis;
import javafx.scene.chart.NumberAxis;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Separator;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.awt.Desktop;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

public class DesktopApp extends Application {

    private static final String API = "http://localhost:8080/api";
    private static final double W = 1180;
    private static final double H = 740;

    private final ApiClient api = new ApiClient(API);
    private Scene scene;
    private Map<String, Object> user;
    private String lastRunId = "";
    private final List<Button> navButtons = new ArrayList<>();

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage) {
        stage.setTitle("RockLogic - Sistema de escritorio");
        stage.setMinWidth(W);
        stage.setMinHeight(H);
        scene = new Scene(new VBox(), W, H);
        scene.getStylesheets().add(getClass().getResource("/styles.css").toExternalForm());
        stage.setScene(scene);
        stage.show();
        showLogin();
    }

    // ===================== UTILIDADES UI =====================

    private Label label(String text) {
        return new Label(text);
    }

    private Label label(String text, String styleClass) {
        Label l = new Label(text);
        l.getStyleClass().add(styleClass);
        return l;
    }

    private void styleField(TextField f) {
        f.getStyleClass().add("field");
        f.setMaxWidth(Double.MAX_VALUE);
    }

    private void styleField(PasswordField f) {
        f.getStyleClass().add("field");
        f.setMaxWidth(Double.MAX_VALUE);
    }

    private VBox title(String t, String sub) {
        VBox v = new VBox(4);
        v.getChildren().add(label(t, "page-title"));
        v.getChildren().add(label(sub, "page-subtitle"));
        VBox.setMargin(v, new Insets(0, 0, 16, 0));
        return v;
    }

    private VBox card(String titleText, String text) {
        VBox v = new VBox(8);
        v.getStyleClass().add("card");
        v.getChildren().add(label(titleText, "card-title"));
        v.getChildren().add(label(text, "card-text"));
        return v;
    }

    private VBox cardOnly(String titleText, Region body) {
        VBox v = new VBox(8);
        v.getStyleClass().add("card");
        v.getChildren().add(label(titleText, "card-title"));
        v.getChildren().add(body);
        return v;
    }

    private VBox kpi(String labelText, String value) {
        VBox v = new VBox(6);
        v.getStyleClass().add("kpi-card");
        v.getChildren().add(label(value, "kpi-value"));
        v.getChildren().add(label(labelText, "kpi-label"));
        return v;
    }

    private Label statusPill(String status) {
        String cls;
        switch (status == null ? "" : status) {
            case "OK" -> cls = "pill-ok";
            case "ERROR" -> cls = "pill-err";
            case "EJECUTANDO" -> cls = "pill-run";
            default -> cls = "pill-rec";
        }
        Label p = label(status == null ? "—" : status, "pill " + cls);
        p.setAlignment(Pos.CENTER);
        return p;
    }

    private TextArea makeLogArea() {
        TextArea a = new TextArea();
        a.getStyleClass().add("log-area");
        a.setEditable(false);
        a.setWrapText(true);
        a.setPrefHeight(180);
        return a;
    }

    private void loading(VBox content) {
        content.getChildren().clear();
        ProgressIndicator pi = new ProgressIndicator();
        pi.setPrefSize(42, 42);
        VBox v = new VBox(10, pi, label("Cargando...", "note"));
        v.setAlignment(Pos.CENTER);
        content.getChildren().add(v);
    }

    private void error(VBox content, String message) {
        content.getChildren().clear();
        Label l = label(message, "error-text");
        l.setWrapText(true);
        content.getChildren().add(l);
    }

    private String idleStyle() {
        return "nav-btn";
    }

    // ===================== LOGIN =====================

    private void showLogin() {
        Label appTitle = label("RockLogic", "app-title");
        Label appSub = label("Gestión inteligente de operaciones mineras", "app-subtitle");

        HBox brand = new HBox(12, chip("R"), new VBox(2, appTitle, appSub));
        brand.setAlignment(Pos.CENTER_LEFT);
        brand.setPadding(new Insets(0, 0, 28, 0));

        Label formTitle = label("Iniciar sesión", "form-title");
        Label formSub = label("Accede a tu empresa y a sus datos", "form-subtitle");

        TextField email = new TextField();
        email.setPromptText("Email");
        email.setText("admin@mineraandina.com");
        styleField(email);

        PasswordField password = new PasswordField();
        password.setPromptText("Contraseña");
        password.setText("admin123");
        styleField(password);

        Label error = label("", "error-text");
        Label ok = label("", "ok-text");
        Label demoTxt = label("CUENTAS DE PRUEBA", "note");

        Button btn = new Button("Ingresar");
        btn.getStyleClass().add("btn-primary");
        btn.setMaxWidth(Double.MAX_VALUE);

        Button checkServer = new Button("Comprobar servidor");
        checkServer.getStyleClass().add("btn-ghost");

        btn.setOnAction(e -> {
            btn.setDisable(true);
            error.setText("");
            ok.setText("");
            new Thread(() -> {
                try {
                    Map<String, Object> res = api.login(email.getText().trim(), password.getText());
                    api.setToken(String.valueOf(res.get("token")));
                    Map<String, Object> u = castMap(res.get("user"));
                    Platform.runLater(() -> {
                        user = u;
                        showMain();
                    });
                } catch (Exception ex) {
                    Platform.runLater(() -> {
                        showErrorAlert("No se pudo iniciar sesión", ex.getMessage());
                        error.setText(ex.getMessage());
                        btn.setDisable(false);
                    });
                }
            }).start();
        });

        checkServer.setOnAction(e -> new Thread(() -> {
            String text;
            try {
                java.net.http.HttpClient c = java.net.http.HttpClient.newHttpClient();
                var req = java.net.http.HttpRequest.newBuilder(
                                java.net.URI.create(API + "/auth/login"))
                        .header("Content-Type", "application/json")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString("{}"))
                        .build();
                var res = c.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                text = res.statusCode() == 401 || res.statusCode() == 400
                        ? "Servidor ONLINE (puerto 8080)" : "Respuesta inesperada: HTTP " + res.statusCode();
            } catch (Exception ex) {
                text = "Servidor OFFLINE. Ejecuta 'run-backend.bat' primero.";
            }
            final String out = text;
            Platform.runLater(() -> ok.setText(out));
        }).start());

        String[] demoLabels = { "Admin", "Operador", "Otra empresa" };
        String[][] demos = {
                { "admin@mineraandina.com", "admin123" },
                { "operador@mineraandina.com", "oper123" },
                { "admin@minadelsur.com", "admin123" },
        };

        HBox demosBox = new HBox(8);
        for (int i = 0; i < demoLabels.length; i++) {
            int idx = i;
            Button d = new Button(demoLabels[i]);
            d.getStyleClass().add("demo-chip");
            d.setOnAction(ev -> {
                email.setText(demos[idx][0]);
                password.setText(demos[idx][1]);
                error.setText("");
                ok.setText("");
            });
            demosBox.getChildren().add(d);
        }

        VBox form = new VBox(12,
                brand,
                formTitle, formSub, email, password,
                error, ok, btn, checkServer,
                new Separator(), demoTxt, demosBox);
        form.setMaxWidth(420);
        form.getStyleClass().add("login-card");

        Region spacer1 = new Region();
        Region spacer2 = new Region();
        HBox.setHgrow(spacer1, Priority.ALWAYS);
        HBox.setHgrow(spacer2, Priority.ALWAYS);
        HBox wrap = new HBox(spacer1, form, spacer2);
        VBox.setVgrow(wrap, Priority.ALWAYS);

        VBox root = new VBox(wrap);
        root.getStyleClass().add("login-bg");
        scene.setRoot(root);

        email.setOnAction(e -> password.requestFocus());
        password.setOnAction(e -> btn.fire());
    }

    private Label chip(String text) {
        Label c = label(text, "brand-chip");
        c.setAlignment(Pos.CENTER);
        return c;
    }

    // ===================== PRINCIPAL =====================

    private void showMain() {
        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color:#f1f5f9;");

        VBox content = new VBox();
        content.setPadding(new Insets(24, 28, 24, 28));
        content.setSpacing(16);

        VBox sidebar = buildSidebar(content);

        ScrollPane scroll = new ScrollPane(content);
        scroll.setFitToWidth(true);
        scroll.getStyleClass().add("scroll-pane");

        root.setLeft(sidebar);
        root.setCenter(scroll);
        scene.setRoot(root);

        activateNav(navButtons.get(0));
        showDashboard(content);
    }

    private VBox buildSidebar(VBox content) {
        VBox sidebar = new VBox(10);
        sidebar.setPadding(new Insets(16));
        sidebar.setPrefWidth(252);
        sidebar.getStyleClass().add("sidebar");

        HBox brandRow = new HBox(10, chip("R"),
                new VBox(2, label("RockLogic", "sidebar-brand"),
                        label("Gestión de operaciones mineras", "sidebar-sub")));
        brandRow.setAlignment(Pos.CENTER_LEFT);

        Button dashBtn = navButton("Dashboard");
        Button uploadBtn = navButton("Cargar archivo");
        Button histBtn = navButton("Historial");
        navButtons.clear();
        navButtons.add(dashBtn);
        navButtons.add(uploadBtn);
        navButtons.add(histBtn);

        Button logoutBtn = new Button("Cerrar sesión");
        logoutBtn.getStyleClass().add("logout-btn");
        logoutBtn.setOnAction(e -> {
            user = null;
            api.setToken("");
            showLogin();
        });

        Region spacer = new Region();
        VBox.setVgrow(spacer, Priority.ALWAYS);

        VBox userCard = buildUserCard();
        sidebar.getChildren().addAll(brandRow, new Separator(),
                dashBtn, uploadBtn, histBtn, spacer, userCard, logoutBtn);

        dashBtn.setOnAction(e -> { activateNav(dashBtn); showDashboard(content); });
        uploadBtn.setOnAction(e -> { activateNav(uploadBtn); showUpload(content); });
        histBtn.setOnAction(e -> { activateNav(histBtn); showHistory(content); });

        return sidebar;
    }

    private VBox buildUserCard() {
        Label avatar = label(str(user, "fullName").isEmpty() ? "U"
                : str(user, "fullName").substring(0, 1).toUpperCase(), "user-avatar");

        VBox info = new VBox(1,
                label(str(user, "fullName"), "user-name"),
                label(str(user, "role"), "user-role"));

        HBox card = new HBox(10, avatar, info);
        card.setAlignment(Pos.CENTER_LEFT);
        card.getStyleClass().add("user-card");

        Label tenant = label("MULTI-TENANT", "tenant-pill");
        tenant.setAlignment(Pos.CENTER);

        VBox userCard = new VBox(8, card, tenant);
        return userCard;
    }

    private Button navButton(String text) {
        Button b = new Button(text);
        b.setMaxWidth(Double.MAX_VALUE);
        b.getStyleClass().add(idleStyle());
        return b;
    }

    private void activateNav(Button activeBtn) {
        for (Button b : navButtons) {
            if (b == activeBtn) {
                b.getStyleClass().removeAll("nav-btn-active");
                b.getStyleClass().add("nav-btn-active");
            } else {
                b.getStyleClass().remove("nav-btn-active");
            }
        }
    }

    // ===================== DASHBOARD =====================

    private void showDashboard(VBox content) {
        loading(content);
        new Thread(() -> {
            try {
                Map<String, Object> d = api.get("/dashboard");
                Platform.runLater(() -> content.getChildren().setAll(buildDashboard(d)));
            } catch (Exception ex) {
                Platform.runLater(() -> error(content, "No se pudo cargar el dashboard: " + ex.getMessage()));
            }
        }).start();
    }

    private List<Node> buildDashboard(Map<String, Object> d) {
        List<Node> nodes = new ArrayList<>();
        nodes.add(title("Dashboard de operación", "Resumen de los procesos de " + str(user, "companyName")));

        HBox cards = new HBox(12);
        cards.getChildren().add(kpi("Procesos", str(d, "totalRuns")));
        cards.getChildren().add(kpi("Filas válidas", str(d, "validRows")));
        cards.getChildren().add(kpi("Filas inválidas", str(d, "invalidRows")));
        cards.getChildren().add(kpi("Tonelaje (t)", str(d, "totalTonnage")));
        cards.getChildren().add(kpi("Ley media Cu (%)", str(d, "avgGrade")));
        nodes.add(cards);

        HBox charts = new HBox(16);
        charts.getChildren().add(cardChart("Tonelaje por zona",
                "En toneladas, según las filas válidas", zonesChart(list(d.get("perZone")))));
        charts.getChildren().add(cardChart("Filas por estado",
                "Distribución de equipos EN_PROCESO / DETENIDO", estadosChart(list(d.get("perEstado")))));
        nodes.add(charts);

        nodes.add(cardRecent("Últimas ejecuciones", recentRunsBox(list(d.get("recentRuns")))));
        return nodes;
    }

    private VBox cardChart(String titleText, String sub, Node body) {
        VBox v = new VBox(6);
        v.getStyleClass().add("card");
        VBox.setVgrow(v, Priority.ALWAYS);
        v.getChildren().add(label(titleText, "card-title"));
        v.getChildren().add(label(sub, "note"));
        if (body instanceof Region r) {
            HBox.setHgrow(r, Priority.ALWAYS);
        }
        v.getChildren().add(body);
        return v;
    }

    private Node zonesChart(List<Object> perZone) {
        CategoryAxis xAxis = new CategoryAxis();
        xAxis.setLabel("Zona");
        NumberAxis yAxis = new NumberAxis();
        yAxis.setLabel("Tonelaje (t)");
        BarChart<String, Number> chart = new BarChart<>(xAxis, yAxis);
        chart.setAnimated(false);
        chart.setLegendVisible(false);
        chart.setTitle(null);
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        for (Object o : perZone) {
            Map<String, Object> z = castMap(o);
            series.getData().add(new XYChart.Data<>(str(z, "name"), dnum(z, "value")));
        }
        chart.getData().add(series);
        chart.setPrefHeight(260);
        return chart;
    }

    private Node estadosChart(List<Object> perEstado) {
        PieChart chart = new PieChart();
        chart.setAnimated(false);
        chart.setStartAngle(90);
        chart.setLegendVisible(true);
        chart.setTitle(null);
        for (Object o : perEstado) {
            Map<String, Object> z = castMap(o);
            chart.getData().add(new PieChart.Data(str(z, "name"), lnum(z, "value")));
        }
        chart.setPrefHeight(260);
        return chart;
    }

    private VBox cardRecent(String titleText, Node body) {
        VBox v = new VBox(10);
        v.getStyleClass().add("card");
        v.getChildren().add(label(titleText, "card-title"));
        v.getChildren().add(body);
        return v;
    }

    private VBox recentRunsBox(List<Object> runs) {
        VBox box = new VBox(6);
        if (runs.isEmpty()) {
            box.getChildren().add(label("Sin procesos todavía. Carga tu primer archivo.", "card-text"));
            return box;
        }
        for (Object o : runs) {
            Map<String, Object> r = castMap(o);
            HBox row = new HBox(12);
            row.setAlignment(Pos.CENTER_LEFT);
            row.getChildren().add(statusPill(str(r, "status")));
            Label file = label(str(r, "originalName"));
            file.getStyleClass().add("card-text");
            file.setMaxWidth(280);
            HBox.setHgrow(file, Priority.ALWAYS);
            row.getChildren().add(file);
            row.getChildren().add(label(lnum(r, "validRows") + " vál. / "
                    + lnum(r, "invalidRows") + " invál.", "note"));
            row.getChildren().add(label(str(r, "totalTonnage") + " t · "
                    + str(r, "executedByName"), "note"));
            box.getChildren().add(row);
        }
        return box;
    }

    // ===================== SUBIR ARCHIVO =====================

    private void showUpload(VBox content) {
        content.getChildren().clear();
        content.getChildren().add(title("Cargar datos de operación",
                "Sube un CSV o Excel. El sistema valida, transforma y cruza con el catálogo."));

        VBox box = new VBox(12);
        box.getStyleClass().add("card");

        Label fileLbl = label("Ningún archivo seleccionado", "card-text");
        AtomicReference<Path> chosen = new AtomicReference<>();

        Button runBtn = new Button("Subir y procesar");
        runBtn.getStyleClass().add("btn-primary");
        runBtn.setDisable(true);

        Button reportBtn = new Button("Descargar Excel y PDF");
        reportBtn.getStyleClass().add("btn-success");
        reportBtn.setDisable(true);

        Button select = new Button("Elegir archivo (.csv / .xlsx)");
        select.getStyleClass().add("btn-secondary");
        select.setOnAction(e -> {
            FileChooser fc = new FileChooser();
            fc.getExtensionFilters().add(
                    new FileChooser.ExtensionFilter("Excel y CSV", "*.csv", "*.xlsx", "*.xls"));
            File f = fc.showOpenDialog(scene.getWindow());
            if (f != null) {
                chosen.set(f.toPath());
                runBtn.setDisable(false);
                fileLbl.setText("✓ " + f.getName());
            }
        });

        Label msg = label("", "ok-text");
        Label err = label("", "error-text");
        ProgressIndicator progress = new ProgressIndicator();
        progress.setPrefSize(22, 22);
        progress.setVisible(false);

        runBtn.setOnAction(e -> {
            Path file = chosen.get();
            if (file == null) return;
            runBtn.setDisable(true);
            reportBtn.setDisable(true);
            progress.setVisible(true);
            msg.setText("");
            err.setText("");
            new Thread(() -> {
                try {
                    Map<String, Object> up = api.uploadFile("/uploads", file);
                    Map<String, Object> run = api.postJson("/uploads/" + up.get("id") + "/run", Map.of());
                    Platform.runLater(() -> {
                        progress.setVisible(false);
                        runBtn.setDisable(false);
                        lastRunId = String.valueOf(run.get("id"));
                        if ("ERROR".equals(str(run, "status"))) {
                            err.setText("El proceso falló: " + logs(run));
                        } else {
                            msg.setText("✓ Proceso OK · " + str(run, "validRows") + " válidas, "
                                    + str(run, "invalidRows") + " inválidas · "
                                    + str(run, "totalTonnage") + " t · ley "
                                    + str(run, "avgGrade") + " % · "
                                    + (dnum(run, "durationMs") / 1000.0) + " s");
                            reportBtn.setDisable(false);
                        }
                    });
                } catch (Exception ex) {
                    Platform.runLater(() -> {
                        progress.setVisible(false);
                        runBtn.setDisable(false);
                        err.setText(ex.getMessage());
                    });
                }
            }).start();
        });

        reportBtn.setOnAction(e -> new Thread(() -> {
            try {
                Path home = Path.of(System.getProperty("user.home"), "Downloads", "MineOps_reportes");
                Files.createDirectories(home);
                api.download("/runs/" + lastRunId + "/download/excel", home.resolve("reporte.xlsx"));
                api.download("/runs/" + lastRunId + "/download/pdf", home.resolve("reporte.pdf"));
                Desktop.getDesktop().open(home.toFile());
            } catch (Exception ex) {
                Platform.runLater(() -> err.setText("No se pudo descargar: " + ex.getMessage()));
            }
        }).start());

        HBox buttons = new HBox(10, select, runBtn, reportBtn);
        buttons.setAlignment(Pos.CENTER_LEFT);
        box.getChildren().addAll(fileLbl, buttons, progress, msg, err);

        VBox formatCard = new VBox(8);
        formatCard.getStyleClass().add("card-dark");
        TextArea format = new TextArea(formatHelp());
        format.getStyleClass().add("log-area");
        format.setEditable(false);
        format.setWrapText(true);
        format.setPrefHeight(180);
        formatCard.getChildren().add(label("Formato esperado", "card-title-light"));
        formatCard.getChildren().add(format);

        content.getChildren().addAll(box, formatCard);
    }

    private String formatHelp() {
        return "Columnas esperadas:\n  fecha; turno; zona; equipo; tonelaje; ley_cu; estado\n\n"
                + "Reglas que aplica el sistema:\n"
                + "  • fecha: 12/09/2026 o 2026-09-12\n"
                + "  • turno: A, B o C\n"
                + "  • zona: Norte, Sur, Este, Oeste, Centro\n"
                + "  • tonelaje: mayor a 0 y menor a 100000 (acepta coma o punto decimal)\n"
                + "  • ley_cu: entre 0 y 100\n"
                + "  • equipo: debe existir en el catálogo de tu empresa\n\n"
                + "En la carpeta sample-data/ tenés archivos de ejemplo para probar.";
    }

    // ===================== HISTORIAL =====================

    @SuppressWarnings("unchecked")
    private void showHistory(VBox content) {
        loading(content);
        new Thread(() -> {
            try {
                List<Object> runs = api.getList("/runs");
                List<Map<String, Object>> rows = new ArrayList<>();
                for (Object o : runs) rows.add(castMap(o));
                Platform.runLater(() -> content.getChildren().setAll(buildHistory(rows)));
            } catch (Exception ex) {
                Platform.runLater(() -> error(content, "No se pudo cargar el historial: " + ex.getMessage()));
            }
        }).start();
    }

    private List<Node> buildHistory(List<Map<String, Object>> rows) {
        List<Node> nodes = new ArrayList<>();
        nodes.add(title("Historial de ejecuciones",
                "Cada proceso guarda resultados, KPIs, log y reportes."));

        if (rows.isEmpty()) {
            nodes.add(card("Historial", "Sin procesos todavía. Sube tu primer archivo en 'Cargar archivo'."));
            return nodes;
        }

        TableView<Map<String, Object>> table = new TableView<>();
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        table.setPlaceholder(new Label("No hay procesos"));

        TableColumn<Map<String, Object>, String> colArchivo = new TableColumn<>("Archivo");
        colArchivo.setCellValueFactory(cd -> new SimpleStringProperty(str(cd.getValue(), "originalName")));
        colArchivo.setPrefWidth(210);

        TableColumn<Map<String, Object>, String> colFecha = new TableColumn<>("Fecha");
        colFecha.setCellValueFactory(cd -> new SimpleStringProperty(str(cd.getValue(), "finishedAt")));
        colFecha.setPrefWidth(150);

        TableColumn<Map<String, Object>, String> colEstado = new TableColumn<>("Estado");
        colEstado.setCellValueFactory(cd -> new SimpleStringProperty(str(cd.getValue(), "status")));
        colEstado.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    setGraphic(statusPill(item));
                }
            }
        });
        colEstado.setPrefWidth(110);

        TableColumn<Map<String, Object>, String> colValidas = new TableColumn<>("Válidas / Inválidas");
        colValidas.setCellValueFactory(cd -> new SimpleStringProperty(lnum(cd.getValue(), "validRows")
                + " / " + lnum(cd.getValue(), "invalidRows")));
        colValidas.setPrefWidth(120);

        TableColumn<Map<String, Object>, String> colTon = new TableColumn<>("Tonelaje");
        colTon.setCellValueFactory(cd -> new SimpleStringProperty(str(cd.getValue(), "totalTonnage")));
        colTon.setPrefWidth(90);

        TableColumn<Map<String, Object>, String> colLey = new TableColumn<>("Ley Cu");
        colLey.setCellValueFactory(cd -> new SimpleStringProperty(str(cd.getValue(), "avgGrade")));
        colLey.setPrefWidth(90);

        TableColumn<Map<String, Object>, String> colDur = new TableColumn<>("Duración (s)");
        colDur.setCellValueFactory(cd -> new SimpleStringProperty(
                cd.getValue().get("durationMs") instanceof Number n
                        ? String.format("%.1f", n.longValue() / 1000.0) : "—"));
        colDur.setPrefWidth(100);

        TableColumn<Map<String, Object>, String> colUser = new TableColumn<>("Usuario");
        colUser.setCellValueFactory(cd -> new SimpleStringProperty(str(cd.getValue(), "executedByName")));
        colUser.setPrefWidth(120);

        table.getColumns().addAll(colArchivo, colFecha, colEstado, colValidas, colTon, colLey, colDur, colUser);
        table.getItems().addAll(rows);
        table.setPrefHeight(320);

        TextArea logArea = makeLogArea();
        logArea.setPromptText("Selecciona una fila para ver el log de ejecución");

        table.getSelectionModel().selectedItemProperty().addListener((obs, o, n) -> {
            if (n == null) logArea.setText("");
            else logArea.setText("### " + str(n, "originalName") + " (#" + str(n, "id") + ")\n\n" + logs(n));
        });

        nodes.add(table);
        nodes.add(cardOnly("Log de ejecución", logArea));
        return nodes;
    }

    // ===================== HELPERS DATOS =====================

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object o) {
        return (Map<String, Object>) o;
    }

    @SuppressWarnings("unchecked")
    private List<Object> list(Object o) {
        return o instanceof List<?> l ? (List<Object>) l : List.of();
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? "" : String.valueOf(v);
    }

    private double dnum(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v instanceof Number n ? n.doubleValue() : 0;
    }

    private long lnum(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v instanceof Number n ? n.longValue() : 0;
    }

    private String logs(Map<String, Object> r) {
        String l = str(r, "logs");
        return l.isEmpty() ? "Sin log" : l;
    }

    private void showErrorAlert(String header, String body) {
        Alert a = new Alert(Alert.AlertType.ERROR);
        a.setTitle(header);
        a.setHeaderText(header);
        a.setContentText(body);
        a.show();
    }
}