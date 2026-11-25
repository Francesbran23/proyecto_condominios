CREATE DATABASE  IF NOT EXISTS `bureau-manager` /*!40100 DEFAULT CHARACTER SET utf8 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bureau-manager`;
-- MySQL dump 10.13  Distrib 8.0.28, for Win64 (x86_64)
--
-- Host: localhost    Database: bureau-manager
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `adeudos anteriores`
--

DROP TABLE IF EXISTS `adeudos anteriores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adeudos anteriores` (
  `id_adeudos` int NOT NULL AUTO_INCREMENT,
  `monto_adeudos` double NOT NULL,
  `descripcion_adeudos` varchar(45) NOT NULL,
  PRIMARY KEY (`id_adeudos`),
  CONSTRAINT `chk_adeudos_monto_no_negativo` CHECK (`monto_adeudos` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adeudos anteriores`
--

LOCK TABLES `adeudos anteriores` WRITE;
/*!40000 ALTER TABLE `adeudos anteriores` DISABLE KEYS */;
/*!40000 ALTER TABLE `adeudos anteriores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administrador`
--

DROP TABLE IF EXISTS `administrador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrador` (
  `id_administrador` int NOT NULL AUTO_INCREMENT,
  `nombre_administrador` varchar(30) NOT NULL,
  `apellido_paterno_administrador` varchar(30) NOT NULL,
  `apellido_materno_administrador` varchar(30) NOT NULL,
  `correo_administrador` varchar(45) NOT NULL,
  `contraseña_administrador` varchar(255) NOT NULL,
  PRIMARY KEY (`id_administrador`),
  UNIQUE KEY `uq_administrador_correo` (`correo_administrador`),
  CONSTRAINT `chk_administrador_correo` CHECK (
    `correo_administrador` = TRIM(`correo_administrador`)
    AND `correo_administrador` REGEXP '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ),
  CONSTRAINT `chk_administrador_contrasena_longitud` CHECK (CHAR_LENGTH(`contraseña_administrador`) >= 8),
  CONSTRAINT `chk_administrador_nombre` CHECK (CHAR_LENGTH(TRIM(`nombre_administrador`)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrador`
--

LOCK TABLES `administrador` WRITE;
/*!40000 ALTER TABLE `administrador` DISABLE KEYS */;
/*!40000 ALTER TABLE `administrador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id_administrador` int NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_administrador`),
  UNIQUE KEY `uq_password_reset_token_hash` (`token_hash`),
  CONSTRAINT `chk_password_reset_token_hash` CHECK (`token_hash` REGEXP '^[0-9a-f]{64}$'),
  CONSTRAINT `fk_password_reset_administrador`
    FOREIGN KEY (`id_administrador`) REFERENCES `administrador` (`id_administrador`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `concepto de pago`
--

DROP TABLE IF EXISTS `concepto de pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `concepto de pago` (
  `id_concepto` int NOT NULL AUTO_INCREMENT,
  `descripcion_concepto` varchar(45) NOT NULL,
  PRIMARY KEY (`id_concepto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `concepto de pago`
--

LOCK TABLES `concepto de pago` WRITE;
/*!40000 ALTER TABLE `concepto de pago` DISABLE KEYS */;
/*!40000 ALTER TABLE `concepto de pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `condominio`
--

DROP TABLE IF EXISTS `condominio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `condominio` (
  `id_condominio` int NOT NULL AUTO_INCREMENT,
  `nombre_condominio` varchar(45) NOT NULL,
  `direccion_condominio` varchar(100) NOT NULL,
  PRIMARY KEY (`id_condominio`),
  UNIQUE KEY `uq_condominio_nombre` (`nombre_condominio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `condominio`
--

LOCK TABLES `condominio` WRITE;
/*!40000 ALTER TABLE `condominio` DISABLE KEYS */;
/*!40000 ALTER TABLE `condominio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuota de fondo de reserva`
--

DROP TABLE IF EXISTS `cuota de fondo de reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuota de fondo de reserva` (
  `id_reserva` int NOT NULL AUTO_INCREMENT,
  `monto_reserva` double NOT NULL,
  `descripcion_reserva` varchar(45) NOT NULL,
  PRIMARY KEY (`id_reserva`),
  CONSTRAINT `chk_reserva_monto_no_negativo` CHECK (`monto_reserva` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuota de fondo de reserva`
--

LOCK TABLES `cuota de fondo de reserva` WRITE;
/*!40000 ALTER TABLE `cuota de fondo de reserva` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuota de fondo de reserva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuota de penalización`
--

DROP TABLE IF EXISTS `cuota de penalización`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuota de penalización` (
  `id_penalizacion` int NOT NULL AUTO_INCREMENT,
  `monto_penalizacion` double NOT NULL,
  `descripcion_penalizacion` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_penalizacion`),
  CONSTRAINT `chk_penalizacion_monto_no_negativo` CHECK (`monto_penalizacion` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuota de penalización`
--

LOCK TABLES `cuota de penalización` WRITE;
/*!40000 ALTER TABLE `cuota de penalización` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuota de penalización` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuota extraordinaria`
--

DROP TABLE IF EXISTS `cuota extraordinaria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuota extraordinaria` (
  `id_extraordinaria` int NOT NULL AUTO_INCREMENT,
  `monto_extraordinaria` double NOT NULL,
  `descrpicion_extraordinaria` varchar(45) NOT NULL,
  PRIMARY KEY (`id_extraordinaria`),
  CONSTRAINT `chk_extraordinaria_monto_no_negativo` CHECK (`monto_extraordinaria` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuota extraordinaria`
--

LOCK TABLES `cuota extraordinaria` WRITE;
/*!40000 ALTER TABLE `cuota extraordinaria` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuota extraordinaria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuota ordinaria`
--

DROP TABLE IF EXISTS `cuota ordinaria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuota ordinaria` (
  `id_ordinaria` int NOT NULL AUTO_INCREMENT,
  `monto_ordinaria` double NOT NULL,
  `descripcion_ordinaria` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_ordinaria`),
  CONSTRAINT `chk_ordinaria_monto_no_negativo` CHECK (`monto_ordinaria` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuota ordinaria`
--

LOCK TABLES `cuota ordinaria` WRITE;
/*!40000 ALTER TABLE `cuota ordinaria` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuota ordinaria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamento`
--

DROP TABLE IF EXISTS `departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `id_edificio` int NOT NULL,
  `numero_departamento` varchar(10) NOT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_departamento_edificio_numero` (`id_edificio`, `numero_departamento`),
  KEY `id_edificio_idx` (`id_edificio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamento`
--

LOCK TABLES `departamento` WRITE;
/*!40000 ALTER TABLE `departamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `departamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `direccion condominio`
--

DROP TABLE IF EXISTS `direccion condominio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `direccion condominio` (
  `id_direccion` int NOT NULL AUTO_INCREMENT,
  `numero_exterior_direccion` int NOT NULL,
  `calle_direccion` varchar(45) NOT NULL,
  `colonia_direccion` varchar(45) NOT NULL,
  `delegacion_direccion` varchar(45) NOT NULL,
  `cp_direccion` int NOT NULL,
  `ciudad_direccion` varchar(45) NOT NULL,
  `estado_direccion` varchar(45) NOT NULL,
  PRIMARY KEY (`id_direccion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `direccion condominio`
--

LOCK TABLES `direccion condominio` WRITE;
/*!40000 ALTER TABLE `direccion condominio` DISABLE KEYS */;
/*!40000 ALTER TABLE `direccion condominio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `edificio`
--

DROP TABLE IF EXISTS `edificio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `edificio` (
  `id_edificio` int NOT NULL AUTO_INCREMENT,
  `id_condominio` int NOT NULL,
  `nombre_edificio` varchar(20) NOT NULL,
  PRIMARY KEY (`id_edificio`),
  UNIQUE KEY `uq_edificio_condominio_nombre` (`id_condominio`, `nombre_edificio`),
  KEY `id_condominio_idx` (`id_condominio`),
  CONSTRAINT `id_condominio` FOREIGN KEY (`id_condominio`) REFERENCES `condominio` (`id_condominio`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `edificio`
--

LOCK TABLES `edificio` WRITE;
/*!40000 ALTER TABLE `edificio` DISABLE KEYS */;
/*!40000 ALTER TABLE `edificio` ENABLE KEYS */;
UNLOCK TABLES;

ALTER TABLE `departamento`
  ADD CONSTRAINT `id_edificio` FOREIGN KEY (`id_edificio`)
    REFERENCES `edificio` (`id_edificio`) ON UPDATE CASCADE;

--
-- Table structure for table `fecha de pago`
--

DROP TABLE IF EXISTS `fecha de pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fecha de pago` (
  `id_fecha` int NOT NULL AUTO_INCREMENT,
  `dia_fecha` int NOT NULL,
  `mes_fecha` varchar(15) NOT NULL,
  `año_fecha` int NOT NULL,
  PRIMARY KEY (`id_fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fecha de pago`
--

LOCK TABLES `fecha de pago` WRITE;
/*!40000 ALTER TABLE `fecha de pago` DISABLE KEYS */;
/*!40000 ALTER TABLE `fecha de pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inquilino`
--

DROP TABLE IF EXISTS `inquilino`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inquilino` (
  `id_inquilino` int NOT NULL AUTO_INCREMENT,
  `id_departamento` int DEFAULT NULL,
  `nombre_inquilino` varchar(45) NOT NULL,
  `apellino_paterno_inquilino` varchar(45) NOT NULL,
  `apellino_materno_inquilino` varchar(45) NOT NULL,
  `correo_inquilino` varchar(45) NOT NULL,
  PRIMARY KEY (`id_inquilino`),
  UNIQUE KEY `uq_inquilino_departamento_identidad` (`id_departamento`, `nombre_inquilino`, `apellino_paterno_inquilino`, `apellino_materno_inquilino`, `correo_inquilino`),
  KEY `id_departamento_idx` (`id_departamento`),
  CONSTRAINT `chk_inquilino_correo` CHECK (
    `correo_inquilino` = TRIM(`correo_inquilino`)
    AND `correo_inquilino` REGEXP '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ),
  CONSTRAINT `id_departamento` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inquilino`
--

LOCK TABLES `inquilino` WRITE;
/*!40000 ALTER TABLE `inquilino` DISABLE KEYS */;
/*!40000 ALTER TABLE `inquilino` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recibo`
--

DROP TABLE IF EXISTS `recibo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recibo` (
  `id_recibo` int NOT NULL AUTO_INCREMENT,
  `no_recibo` varchar(20) NOT NULL,
  `id_condominio` int NOT NULL,
  `id_departamento` int NOT NULL,
  `id_inquilino` int NOT NULL,
  `fecha` date NOT NULL,
  `estado_pago` enum('pendiente','pagado') NOT NULL DEFAULT 'pendiente',
  `fecha_pago` datetime DEFAULT NULL,
  `id_concepto` int NOT NULL,
  `id_ordinaria` int NOT NULL,
  `id_extraordinaria` int NOT NULL,
  `id_penalizacion` int NOT NULL,
  `id_reserva` int NOT NULL,
  `id_adeudos` int NOT NULL,
  `id_total` int NOT NULL,
  `id_administrador` int NOT NULL,
  PRIMARY KEY (`id_recibo`),
  KEY `id_condominio_idx` (`id_condominio`),
  KEY `id_departamento_idx` (`id_departamento`),
  KEY `id_inquilino_idx` (`id_inquilino`),
  UNIQUE KEY `uq_recibo_condominio_numero` (`id_condominio`, `no_recibo`),
  UNIQUE KEY `uq_recibo_concepto` (`id_concepto`),
  UNIQUE KEY `uq_recibo_ordinaria` (`id_ordinaria`),
  UNIQUE KEY `uq_recibo_extraordinaria` (`id_extraordinaria`),
  UNIQUE KEY `uq_recibo_penalizacion` (`id_penalizacion`),
  UNIQUE KEY `uq_recibo_reserva` (`id_reserva`),
  UNIQUE KEY `uq_recibo_adeudos` (`id_adeudos`),
  UNIQUE KEY `uq_recibo_total` (`id_total`),
  KEY `id_concepto_idx` (`id_concepto`),
  KEY `id_ordinaria_idx` (`id_ordinaria`),
  KEY `id_extraordinaria_idx` (`id_extraordinaria`),
  KEY `id_penalizacion_idx` (`id_penalizacion`),
  KEY `id_reserva_idx` (`id_reserva`),
  KEY `id_adeudos_idx` (`id_adeudos`),
  KEY `id_total_idx` (`id_total`),
  KEY `id_administrador_idx` (`id_administrador`),
  CONSTRAINT `chk_recibo_numero_no_vacio` CHECK (CHAR_LENGTH(TRIM(`no_recibo`)) > 0),
  CONSTRAINT `chk_recibo_pago_fecha_estado` CHECK (
    (`estado_pago` = 'pagado' AND `fecha_pago` IS NOT NULL)
    OR (`estado_pago` = 'pendiente' AND `fecha_pago` IS NULL)
  ),
  CONSTRAINT `chk_recibo_fecha_pago_no_anticipada` CHECK (`fecha_pago` IS NULL OR `fecha_pago` >= CAST(`fecha` AS DATETIME)),
  CONSTRAINT `adeudos` FOREIGN KEY (`id_adeudos`) REFERENCES `adeudos anteriores` (`id_adeudos`) ON UPDATE CASCADE,
  CONSTRAINT `administrador` FOREIGN KEY (`id_administrador`) REFERENCES `administrador` (`id_administrador`) ON UPDATE CASCADE,
  CONSTRAINT `concepto` FOREIGN KEY (`id_concepto`) REFERENCES `concepto de pago` (`id_concepto`) ON UPDATE CASCADE,
  CONSTRAINT `condominio` FOREIGN KEY (`id_condominio`) REFERENCES `condominio` (`id_condominio`) ON UPDATE CASCADE,
  CONSTRAINT `departamento` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON UPDATE CASCADE,
  CONSTRAINT `extraordinaria` FOREIGN KEY (`id_extraordinaria`) REFERENCES `cuota extraordinaria` (`id_extraordinaria`) ON UPDATE CASCADE,
  CONSTRAINT `inquilino` FOREIGN KEY (`id_inquilino`) REFERENCES `inquilino` (`id_inquilino`) ON UPDATE CASCADE,
  CONSTRAINT `ordinaria` FOREIGN KEY (`id_ordinaria`) REFERENCES `cuota ordinaria` (`id_ordinaria`) ON UPDATE CASCADE,
  CONSTRAINT `penalizacion` FOREIGN KEY (`id_penalizacion`) REFERENCES `cuota de penalización` (`id_penalizacion`) ON UPDATE CASCADE,
  CONSTRAINT `reserva` FOREIGN KEY (`id_reserva`) REFERENCES `cuota de fondo de reserva` (`id_reserva`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recibo`
--

LOCK TABLES `recibo` WRITE;
/*!40000 ALTER TABLE `recibo` DISABLE KEYS */;
/*!40000 ALTER TABLE `recibo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `total pagado`
--

DROP TABLE IF EXISTS `total pagado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `total pagado` (
  `id_total` int NOT NULL AUTO_INCREMENT,
  `id_ordinaria` int NOT NULL,
  `id_extraordinaria` int NOT NULL,
  `id_penalizacion` int NOT NULL,
  `id_reserva` int NOT NULL,
  `id_adeudos` int NOT NULL,
  `monto_total` double NOT NULL,
  PRIMARY KEY (`id_total`),
  CONSTRAINT `chk_total_monto_no_negativo` CHECK (`monto_total` >= 0),
  KEY `id_ordinaria_idx` (`id_ordinaria`),
  KEY `id_extraordinaria_idx` (`id_extraordinaria`),
  KEY `id_penalizacion_idx` (`id_penalizacion`),
  KEY `id_reserva_idx` (`id_reserva`),
  KEY `id_adeudos_idx` (`id_adeudos`),
  CONSTRAINT `id_adeudos` FOREIGN KEY (`id_adeudos`) REFERENCES `adeudos anteriores` (`id_adeudos`) ON UPDATE CASCADE,
  CONSTRAINT `id_extraordinaria` FOREIGN KEY (`id_extraordinaria`) REFERENCES `cuota extraordinaria` (`id_extraordinaria`) ON UPDATE CASCADE,
  CONSTRAINT `id_ordinaria` FOREIGN KEY (`id_ordinaria`) REFERENCES `cuota ordinaria` (`id_ordinaria`) ON UPDATE CASCADE,
  CONSTRAINT `id_penalizacion` FOREIGN KEY (`id_penalizacion`) REFERENCES `cuota de penalización` (`id_penalizacion`) ON UPDATE CASCADE,
  CONSTRAINT `id_reserva` FOREIGN KEY (`id_reserva`) REFERENCES `cuota de fondo de reserva` (`id_reserva`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `total pagado`
--

LOCK TABLES `total pagado` WRITE;
/*!40000 ALTER TABLE `total pagado` DISABLE KEYS */;
/*!40000 ALTER TABLE `total pagado` ENABLE KEYS */;
UNLOCK TABLES;

ALTER TABLE `recibo`
  ADD CONSTRAINT `total` FOREIGN KEY (`id_total`)
    REFERENCES `total pagado` (`id_total`) ON UPDATE CASCADE;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-04-14 16:09:34
