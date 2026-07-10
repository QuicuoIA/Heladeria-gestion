from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)  # Configuración de espera explícita

        # Localizadores (identifican los elementos en tu web)
        self.username_input = (By.ID, "username")
        self.password_input = (By.ID, "password")
        self.login_button = (By.CSS_SELECTOR, "button[type='submit']")
        self.error_message = (By.CSS_SELECTOR, ".error-text") # Revisa si esta clase existe la web

    def enter_username(self, username):
        # Espera explícita hasta que el elemento sea visible, y escribe
        user_field = self.wait.until(EC.visibility_of_element_located(self.username_input))
        user_field.send_keys(username)

    def enter_password(self, password):
        # Espera explícita y escribe
        pass_field = self.wait.until(EC.visibility_of_element_located(self.password_input))
        pass_field.send_keys(password)

    def click_login(self):
        # Espera explícita hasta que el botón sea clicleable
        login_btn = self.wait.until(EC.element_to_be_clickable(self.login_button))
        login_btn.click()

    def get_error_message(self):
        # Espera explícita hasta que el mensaje de error aparezca
        return self.wait.until(EC.visibility_of_element_located(self.error_message)).text