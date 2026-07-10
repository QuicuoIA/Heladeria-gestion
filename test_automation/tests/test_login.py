import pytest
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage

BASE_URL = "http://127.0.0.1:5500/frontend/index.html" 

def test_login_exitoso(driver):
    login_page = LoginPage(driver)
    dashboard_page = DashboardPage(driver)
    
    driver.get(BASE_URL)
    login_page.enter_username("usuario_valido")
    login_page.enter_password("password_valido")
    login_page.click_login()
    
    assert dashboard_page.is_loaded()

@pytest.mark.parametrize("user, password, expected_error", [
    ("", "password", "El usuario es obligatorio"),
    ("usuario", "", "La contraseña es obligatoria"),
    ("invalido", "invalido", "Credenciales incorrectas")
])
def test_login_credenciales_invalidas(driver, user, password, expected_error):
    login_page = LoginPage(driver)
    
    driver.get(BASE_URL)
    login_page.enter_username(user)
    login_page.enter_password(password)
    login_page.click_login()
    
    # Verifica que el mensaje de error sea el esperado
    assert login_page.get_error_message() == expected_error