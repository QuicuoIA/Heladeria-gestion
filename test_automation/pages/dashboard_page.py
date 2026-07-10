from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class DashboardPage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

        # Localizador de un elemento único del dashboard (ej: título o menú)
        self.dashboard_title = (By.TAG_NAME, "h1") # O el selector que use la web

    def is_loaded(self):
        # Espera explícita para verificar que el título cargue
        title_element = self.wait.until(EC.visibility_of_element_located(self.dashboard_title))
        return title_element.is_displayed()