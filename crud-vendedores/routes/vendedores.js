const express = require("express");
const router = express.Router();
const VendedorController = require("../controllers/vendedor.controller");

// Listar vendedores con opción de búsqueda y paginación
router.get("/", VendedorController.listar);

// Nuevas rutas para paginación y búsqueda
router.get("/paginado", VendedorController.listarPaginado);
router.get("/buscar-paginado", VendedorController.buscarPaginado);

// Formulario de nuevo vendedor
router.get("/nuevo", VendedorController.mostrarFormularioNuevo);

// Crear nuevo vendedor
router.post("/nuevo", VendedorController.crear);

// Formulario de edición
router.get("/editar/:id", VendedorController.mostrarFormularioEditar);

// Actualizar vendedor
router.post("/editar/:id", VendedorController.actualizar);

// Eliminar vendedor
router.get("/eliminar/:id", VendedorController.eliminar);

// Rutas de exportación
router.get("/exportar-pdf", VendedorController.exportarPDF);
router.get("/exportar-csv", VendedorController.exportarCSV);
router.get("/exportar-html", VendedorController.exportarHTML);

// Exportar como PDF o CSV con otras rutas como alternativa
router.get("/pdf", VendedorController.exportarPDF);
router.get("/csv", VendedorController.exportarCSV);

router.delete("/:id", VendedorController.eliminar);

module.exports = router;
