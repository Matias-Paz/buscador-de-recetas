const inicialApp = () => {
  const resultado = document.querySelector("#resultado");

  const selectCategorias = document.querySelector("#categorias");
  if (selectCategorias) {
    selectCategorias.addEventListener("change", seleccionarCategorias);

    obtenerCategorias();
  }

  const favoritosDiv = document.querySelector(".favoritos");
  if (favoritosDiv) {
    obtenerFavoritos();
  }

  const modal = new bootstrap.Modal("#modal", {});

  function obtenerCategorias() {
    const url = "https://www.themealdb.com/api/json/v1/1/categories.php";

    fetch(url)
      .then(resultado => resultado.json())
      .then(resultado => mostrarCategorias(resultado.categories));
  }

  function mostrarCategorias(categorias = []) {
    categorias.forEach(categoria => {
      const { strCategory } = categoria;
      const option = document.createElement("OPTION");

      option.value = strCategory;
      option.textContent = strCategory;
      selectCategorias.appendChild(option);
    });
  }

  async function seleccionarCategorias(e) {
    const categoria = e.target.value;
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

    try {
      const respuesta = await fetch(url);
      const resultado = await respuesta.json();

      mostrarRecetas(resultado.meals);
    } catch (error) {
      console.log(error);
    }
  }

  function mostrarRecetas(recetas = []) {
    limpiarHTML(resultado);

    const heading = document.createElement("H2");
    heading.classList.add("text-center", "text-black", "my-5");

    heading.textContent = recetas.length ? "Resultados" : "No hay resultados";
    resultado.appendChild(heading);

    // Iterar en los resultados
    recetas.forEach(receta => {
      const { idMeal, strMeal, strMealThumb } = receta;

      const recetaContenedor = document.createElement("DIV");
      recetaContenedor.classList.add("col-md-4");

      const recetaCard = document.createElement("DIV");
      recetaCard.classList.add("card", "mb-4");

      const recetaImagen = document.createElement("IMG");
      recetaImagen.classList.add("card-img-top");
      recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.title}`;
      recetaImagen.src = strMealThumb ?? receta.img;

      const recetaCardBody = document.createElement("DIV");
      recetaCardBody.classList.add("card-body");

      const recetaHeading = document.createElement("H3");
      recetaHeading.classList.add("card-title", "mb-3");
      recetaHeading.textContent = strMeal ?? receta.title;

      const recetaBtn = document.createElement("BUTTON");
      recetaBtn.classList.add("btn", "btn-danger", "w-100");
      recetaBtn.textContent = "Ver Receta";
      recetaBtn.onclick = function () {
        selecionarReceta(idMeal ?? receta.id);
      };

      // Inyectar en el codigo HTML

      recetaCardBody.appendChild(recetaHeading);
      recetaCardBody.appendChild(recetaBtn);

      recetaCard.appendChild(recetaImagen);
      recetaCard.appendChild(recetaCardBody);

      recetaContenedor.appendChild(recetaCard);
      resultado.appendChild(recetaContenedor);
    });
  }

  async function selecionarReceta(id) {
    const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    try {
      const respuesta = await fetch(url);
      const resultado = await respuesta.json();

      mostrarRecetasModal(resultado.meals[0]);
    } catch (error) {
      console.error(error);
    }
  }

  function mostrarRecetasModal(receta) {
    // console.log(receta);

    const { idMeal, strInstructions, strMeal, strMealThumb } = receta;

    // Añadir contenido al modal
    const modalTitle = document.querySelector(".modal .modal-title");
    const modalBody = document.querySelector(".modal .modal-body");

    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}">
            <h3 class="my-3">Instructions</h3>
            <p>${strInstructions}</p>

            <h3 class="my-3">Ingredient and Measure</h3>
        `;

    const listGroup = document.createElement("UL");
    listGroup.classList.add("list-group");

    // Mostrar cantidades e ingredientes
    for (let i = 1; i <= 20; i++) {
      if (receta[`strIngredient${i}`]) {
        const ingrediente = receta[`strIngredient${i}`];
        const cantidad = receta[`strMeasure${i}`];

        const ingredienteLi = document.createElement("LI");
        ingredienteLi.classList.add("list-group-item");
        ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;

        listGroup.appendChild(ingredienteLi);
      }
    }

    modalBody.appendChild(listGroup);
    // console.log(receta);

    const modalFooter = document.querySelector(".modal-footer");

    limpiarHTML(modalFooter);

    // Botones de cerrar y favorito
    const btnFavorito = document.createElement("BUTTON");
    btnFavorito.classList.add("btn", "btn-danger", "col");
    btnFavorito.textContent = existeStorage(idMeal)
      ? "Eliminar Favoritos"
      : "Guardar Favorito";

    /// localstorage
    btnFavorito.onclick = function () {
      if (existeStorage(idMeal)) {
        eliminarFavorito(idMeal);
        btnFavorito.textContent = "Guardar Favorito";
        mostrarToast("Eliminado Correctamente");
        return;
      }

      agregarFavorito({
        id: idMeal,
        title: strMeal,
        img: strMealThumb,
      });

      btnFavorito.textContent = "Eliminar Favoritos";
      mostrarToast("Agregado Correctamente");
    };

    const btnCerrarModal = document.createElement("BUTTON");
    btnCerrarModal.classList.add("btn", "btn-secondary", "col");
    btnCerrarModal.textContent = "Cerrar";
    btnCerrarModal.onclick = function () {
      modal.hide();
    };

    modalFooter.appendChild(btnFavorito);
    modalFooter.appendChild(btnCerrarModal);

    // Muestra el modal
    modal.show();
  }

  function agregarFavorito(receta) {
    const favorito = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    localStorage.setItem("favoritos", JSON.stringify([...favorito, receta]));
  }

  function eliminarFavorito(id) {
    const favorito = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    const nuevoFavoritos = favorito.filter(favorito => favorito.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(nuevoFavoritos));
  }

  function existeStorage(id) {
    const favorito = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    return favorito.some(favorito => favorito.id === id);
  }

  function mostrarToast(mensaje) {
    const toastDiv = document.querySelector("#toast");
    const toastBody = document.querySelector(".toast-body");
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = mensaje;
    toast.show();
  }

  function obtenerFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    if (favoritos.length) {
      mostrarRecetas(favoritos);

      return;
    }

    const noFavoritos = document.createElement("P");
    noFavoritos.textContent = "No hay favoritos aún";
    noFavoritos.classList.add("fs-4", "text-center", "font-bold", "mt-5");
    favoritosDiv.appendChild(noFavoritos);
  }

  function limpiarHTML(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }
};

document.addEventListener("DOMContentLoaded", inicialApp);
