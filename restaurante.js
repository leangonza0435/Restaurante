// Precios de productos definidos manualmente
const preciosProductos = {
    "Hamburguesa Clásica": 200,
    "Hamburguesa Doble": 300,
    "Coca": 100,
    "Fanta": 100,
    "Sprite": 100,
    "Coca Cola Zero": 100,
    "Agua": 80,
    "Agua Saborizada": 90,
    "Papas": 150,
    "Combo Clásico": 350,
    "Combo Doble": 450,
    "Combo Familiar": 600,
};

// Función para formatear la fecha en el formato 'dd/mm/yyyy'
function formatearFecha(fecha) {
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0"); // Los meses empiezan desde 0
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

// Función para formatear la hora en el formato 'hh:mm:ss' con zona horaria de Argentina
function formatearHora(fecha) {
    const opciones = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires"
    };
    const horaFormateada = new Intl.DateTimeFormat("es-AR", opciones).format(fecha);
    return horaFormateada;
}

// Configuración de Firebase
var firebaseConfig = {
    apiKey: "AIzaSyCOPxgTeJAEcEh1kpH-sPPk10ZrKT8kOwQ",
    authDomain: "pedidosenlinea-66723.firebaseapp.com",
    databaseURL: "https://pedidosenlinea-66723-default-rtdb.firebaseio.com",
    projectId: "pedidosenlinea-66723",
    storageBucket: "pedidosenlinea-66723.appspot.com",
    messagingSenderId: "626828771215",
    appId: "1:626828771215:web:c31a7b459cb0384ab595fa"
};

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Función para calcular el precio total del pedido
function calcularTotal(pedido) {
    let total = 0;
    pedido.productos.forEach(item => {
        const precioProducto = preciosProductos[item.nombre] || 0;
        total += item.cantidad * precioProducto;
    });
    return total;
}

// Función para mostrar los pedidos
function mostrarPedido(pedido, contenedor) {
    const pedidoElement = document.createElement("div");
    pedidoElement.classList.add("pedido");

    const nombrePedido = document.createElement("h3");
    nombrePedido.textContent = `Pedido para la mesa: ${pedido.mesa}`;

    // Obtener la fecha y hora actuales
    const fechaHora = new Date(pedido.fecha); // Asegúrate de que 'pedido.fecha' tenga el formato correcto
    const fechaFormateada = formatearFecha(fechaHora);
    const horaFormateada = formatearHora(fechaHora);

    // Mostrar la fecha y hora en el pedido
    const fechaHoraElement = document.createElement("p");
    fechaHoraElement.textContent = `Fecha: ${fechaFormateada} - Hora: ${horaFormateada}`;

    const itemsList = document.createElement("ul");
    let bebidas = [];
    let productosCombo = [];

    pedido.productos.forEach(item => {
        const itemElement = document.createElement("li");
        const precioProducto = preciosProductos[item.nombre] || 0;
        itemElement.textContent = `${item.nombre} - Cantidad: ${item.cantidad} - Precio: $${precioProducto}`;
        itemsList.appendChild(itemElement);

        if (item.nombre === "Coca" || item.nombre === "Fanta" || item.nombre === "Sprite" || 
            item.nombre === "Coca Cola Zero" || item.nombre === "Agua" || item.nombre === "Agua Saborizada") {
            bebidas.push(item.nombre);
        }

        if (item.nombre === "Combo Familiar" || item.nombre === "Combo Clásico" || item.nombre === "Combo Doble") {
            productosCombo.push(item.nombre);
            if (item.bebidas && item.bebidas.length > 0) {
                bebidas.push(...item.bebidas);
            }
        }
    });

    // Mostrar las bebidas seleccionadas
    if (bebidas.length > 0) {
        const bebidasElement = document.createElement("li");
        bebidasElement.textContent = `Bebidas seleccionadas: ${bebidas.join(", ")}`;
        itemsList.appendChild(bebidasElement);
    }

    // Mostrar los productos de los combos
    if (productosCombo.length > 0) {
        const comboElement = document.createElement("li");
        comboElement.textContent = `Productos del combo: ${productosCombo.join(", ")}`;
        itemsList.appendChild(comboElement);
    }

    const precioTotal = calcularTotal(pedido);

    const totalElement = document.createElement("p");
    totalElement.textContent = `Total: $${precioTotal}`;

    const botonCompletar = document.createElement("button");
    if (pedido.estado !== "completado") {
        botonCompletar.textContent = "Marcar como completado";
        botonCompletar.onclick = function() {
            db.ref("pedidos/" + pedido.id).update({
                estado: "completado"
            });
            location.reload();
        };
    }

    const downloadButton = document.createElement("button");
    if (pedido.estado === "completado") {
        downloadButton.textContent = "Descargar Ticket";
        downloadButton.onclick = function() {
            generarTicketPDF([pedido]);
        };
    }

    pedidoElement.appendChild(nombrePedido);
    pedidoElement.appendChild(fechaHoraElement);
    pedidoElement.appendChild(itemsList);
    pedidoElement.appendChild(totalElement);

    if (pedido.estado !== "completado") {
        pedidoElement.appendChild(botonCompletar);
    }

    if (pedido.estado === "completado") {
        pedidoElement.appendChild(downloadButton);
    }

    contenedor.appendChild(pedidoElement);
}

// Escucha de cambios en la base de datos para nuevos pedidos
db.ref("pedidos").on("value", (snapshot) => {
    const pedidos = snapshot.val();
    const pedidosContainer = document.getElementById("pedidos");
    const completadosContainer = document.getElementById("pedidosCompletados");

    pedidosContainer.innerHTML = "";
    completadosContainer.innerHTML = "";

    for (let id in pedidos) {
        pedidos[id].id = id;
        if (pedidos[id].estado === "completado") {
            mostrarPedido(pedidos[id], completadosContainer);
        } else {
            mostrarPedido(pedidos[id], pedidosContainer);
        }
    }
});

// Función para generar un ticket PDF para un pedido
function generarTicketPDF(pedidos) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(12);
    doc.text('Tandil Burguer', 10, 45); // El nombre del restaurante
    doc.text(`Fecha: ${formatearFecha(new Date())} Hora: ${formatearHora(new Date())}`, 10, 50);

    let y = 60;
    let pedidosPorMesa = {}; // Objeto para almacenar pedidos por mesa

    // Agrupar pedidos por mesa
    pedidos.forEach(pedido => {
        if (!pedidosPorMesa[pedido.mesa]) {
            pedidosPorMesa[pedido.mesa] = [];
        }
        pedidosPorMesa[pedido.mesa].push(pedido);
    });

    // Generar ticket para cada mesa
    for (let mesa in pedidosPorMesa) {
        doc.setFontSize(12);
        doc.text(`Mesa: ${mesa}`, 10, y);
        y += 10;

        pedidosPorMesa[mesa].forEach(pedido => {
            doc.setFontSize(10);
            doc.text(`Pedido para la mesa: ${pedido.mesa}`, 10, y);
            y += 10;

            pedido.productos.forEach(item => {
                doc.setFontSize(10);
                doc.text(`${item.nombre} x${item.cantidad} - $${preciosProductos[item.nombre] || 0}`, 10, y);
                y += 6;
            });

            doc.text(`Total: $${calcularTotal(pedido)}`, 10, y);
            y += 10;
        });
    }

    doc.save('ticket_pedido.pdf');
}

// Función para agregar un nuevo pedido (con fecha y hora en horario de Argentina)
function agregarNuevoPedido(pedido) {
    // Crear la fecha y hora en formato de Argentina (hora GMT-3)
    const fechaHora = new Date();
    
    // Formateamos la fecha
    const fecha = formatearFecha(fechaHora);
    
    // Formateamos la hora
    const hora = formatearHora(fechaHora);

    // Guardamos la fecha y la hora sin la parte "Z"
    pedido.fecha = fecha;
    pedido.hora = hora;

    const nuevoPedidoRef = db.ref("pedidos").push();
    nuevoPedidoRef.set(pedido);
}