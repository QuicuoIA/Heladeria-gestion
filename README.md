#  Heladería POS & Gestión de Inventario

##  Estándares de Código y Arquitectura

Para mantener la calidad y mantenibilidad del sistema, todo el equipo debe seguir estas reglas:

### 1. Estrategia de Ramas (Git Flow)
* `main`: Solo para código de producción (estable).
* `develop`: Rama de integración principal.
* `feat/nombre-tarea`: Para desarrollar nuevas funcionalidades (ej. `feat/login`, `feat/catalogo`).

### 2. Convenciones de Nomenclatura
* **JavaScript/TypeScript:** Usar `camelCase` para variables y funciones (ej. `registroVentas`).
* **Base de Datos (SQL):** Usar `snake_case` para tablas y columnas (ej. `id_usuario`, `neveria_ventas`).

### 3. Conventional Commits
Cada commit debe explicar claramente qué se hizo usando prefijos:
* `feat:` Nueva característica.
* `fix:` Solución de un error.
* `docs:` Cambios en la documentación.