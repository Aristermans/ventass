const VendedorModel = require("../models/vendedor.model");
const path = require("path");

class VendedorController {
  static async listar(req, res) {
    const { busqueda, tipo, pagina = 1, porPagina = 10 } = req.query;
    
    // Convertir a números los parámetros de paginación
    const paginaNum = parseInt(pagina, 10) || 1;
    const porPaginaNum = parseInt(porPagina, 10) || 10;
    
    try {
      let resultado;
      
      if (busqueda && tipo) {
        if (tipo === "todos" || tipo === "nombre" || tipo === "apellido") {
          resultado = await VendedorModel.buscarPaginado(busqueda, paginaNum, porPaginaNum);
        } else if (tipo === "id") {
          // Ahora usamos buscarPorId que es el método correcto
          const vendedores = await VendedorModel.buscarPorId(busqueda);
          resultado = {
            vendedores,
            total: vendedores.length,
            totalPaginas: 1,
            paginaActual: 1,
            porPagina: porPaginaNum
          };
        }
      } else {
        // Listar todos con paginación
        resultado = await VendedorModel.listarPaginado(paginaNum, porPaginaNum);
      }

      // Normalizamos la estructura de datos de resultado
      const vendedores = resultado.vendedores || [];
      const totalVendedores = resultado.total || 0;
      const totalPaginas = Math.ceil(totalVendedores / porPaginaNum);

      const distritos = await VendedorModel.listarDistritos();
      
      // Renderizamos la vista con todos los datos normalizados
      res.render("index", {
        vendedores: vendedores,
        paginacion: {
          total: totalVendedores,
          paginas: totalPaginas,
          actual: paginaNum,
          porPagina: porPaginaNum
        },
        distritos,
        busqueda: busqueda || "",
        tipo: tipo || "todos",
      });
    } catch (error) {
      console.error("Error al listar vendedores:", error);
      const distritos = await VendedorModel.listarDistritos().catch(() => []);
      res.status(500).render("index", {
        vendedores: [],
        paginacion: {
          total: 0,
          paginas: 0,
          actual: 1,
          porPagina: porPaginaNum
        },
        distritos,
        busqueda: busqueda || "",
        tipo: tipo || "todos",
        error: `Error: ${error.message}`
      });
    }
  }

  static async mostrarFormularioNuevo(req, res) {
    try {
      const distritos = await VendedorModel.listarDistritos();
      res.render("form_vendedor", { 
        vendedor: {}, 
        distritos, 
        accion: "nuevo",
        titulo: "Nuevo Vendedor" 
      });
    } catch (error) {
      console.error("Error al mostrar formulario:", error);
      res.status(500).render("error", { 
        mensaje: "Error al cargar el formulario", 
        error: error.message 
      });
    }
  }

  static async crear(req, res) {
    const { nom_ven, ape_ven, cel_ven, id_distrito } = req.body;
    
    try {
      await VendedorModel.crear(nom_ven, ape_ven, cel_ven, id_distrito);
      res.redirect("/vendedores");
    } catch (error) {
      console.error("Error al crear vendedor:", error);
      const distritos = await VendedorModel.listarDistritos().catch(() => []);
      res.status(500).render("form_vendedor", { 
        vendedor: req.body, 
        distritos, 
        accion: "nuevo",
        error: `Error al crear vendedor: ${error.message}`,
        titulo: "Nuevo Vendedor" 
      });
    }
  }

  static async mostrarFormularioEditar(req, res) {
    const id = req.params.id;
    
    try {
      const vendedores = await VendedorModel.buscarPorId(id);
      if (vendedores.length === 0) {
        return res.status(404).render("error", { 
          mensaje: "Vendedor no encontrado", 
          error: `No se encontró ningún vendedor con ID ${id}` 
        });
      }
      
      const distritos = await VendedorModel.listarDistritos();
      res.render("form_vendedor", {
        vendedor: vendedores[0],
        distritos,
        accion: "editar",
        titulo: "Editar Vendedor"
      });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).render("error", { 
        mensaje: "Error al cargar el formulario de edición", 
        error: error.message 
      });
    }
  }

  static async actualizar(req, res) {
    const id = req.params.id;
    const { nom_ven, ape_ven, cel_ven, id_distrito } = req.body;
    
    try {
      await VendedorModel.actualizar(id, nom_ven, ape_ven, cel_ven, id_distrito);
      res.redirect("/vendedores");
    } catch (error) {
      console.error("Error al actualizar vendedor:", error);
      const distritos = await VendedorModel.listarDistritos().catch(() => []);
      res.status(500).render("form_vendedor", { 
        vendedor: { ...req.body, id_ven: id }, 
        distritos, 
        accion: "editar",
        error: `Error al actualizar vendedor: ${error.message}`,
        titulo: "Editar Vendedor" 
      });
    }
  }

  static async eliminar(req, res) {
    const id = req.params.id;
    
    try {
      await VendedorModel.eliminar(id);
      res.redirect("/vendedores");
    } catch (error) {
      console.error("Error al eliminar vendedor:", error);
      res.status(500).render("error", { 
        mensaje: "Error al eliminar vendedor", 
        error: error.message 
      });
    }
  }
  
  static async exportarPDF(req, res) {
    try {
      const vendedores = await VendedorModel.listarTodos();
      const PdfPrinter = require("pdfmake");

      const fonts = {
        Roboto: {
          normal: "Helvetica",
          bold: "Helvetica-Bold",
          italics: "Helvetica-Oblique",
          bolditalics: "Helvetica-BoldOblique",
        },
      };

      const printer = new PdfPrinter(fonts);

      const docDefinition = {
        content: [
          { text: "Lista de Vendedores", style: "header" },
          {
            table: {
              headerRows: 1,
              widths: ["auto", "*", "*", "auto", "*"],
              body: [
                ["ID", "Nombre", "Apellido", "Celular", "Distrito"],
                ...vendedores.map((v) => [
                  v.id_ven,
                  v.nom_ven,
                  v.ape_ven,
                  v.cel_ven,
                  v.distrito
                ]),
              ],
            },
          },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10],
          },
        },
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=vendedores.pdf");
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      console.error("Error en exportarPDF:", error);
      res.status(500).json({
        success: false,
        message: `Error al generar PDF: ${error.message}`,
      });
    }
  }

  static async exportarCSV(req, res) {
    try {
      const vendedores = await VendedorModel.listarTodos();
      const { Parser } = require("json2csv");

      const fields = ["id_ven", "nom_ven", "ape_ven", "cel_ven", "distrito"];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(vendedores);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=vendedores.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error al generar CSV:", error);
      res.status(500).json({ success: false, message: "Error al generar CSV" });
    }
  }

  static async exportarHTML(req, res) {
    try {
      const vendedores = await VendedorModel.listarTodos();
      let html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Lista de Vendedores</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { color: #333; }
          .print-btn { margin: 20px 0; padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Lista de Vendedores</h1>
        <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Celular</th>
              <th>Distrito</th>
            </tr>
          </thead>
          <tbody>`;
      vendedores.forEach((v) => {
        html += `<tr><td>${v.id_ven}</td><td>${v.nom_ven}</td><td>${v.ape_ven}</td><td>${v.cel_ven}</td><td>${v.distrito}</td></tr>`;
      });

      html += `</tbody></table>
      <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
      </body>
      </html>`;

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Error al generar HTML:", error);
      res.status(500).send(`<p>Error al generar la vista: ${error.message}</p>`);
    }
  }
}

module.exports = VendedorController;