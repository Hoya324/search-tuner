CREATE TABLE IF NOT EXISTS shop (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    category    VARCHAR(100) NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    shop_id      BIGINT       NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    description  TEXT,
    brand        VARCHAR(255),
    category     VARCHAR(100) NOT NULL,
    price        DECIMAL(12, 2),
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_product_shop_id (shop_id),
    INDEX idx_product_category (category),
    INDEX idx_product_updated_at (updated_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS synonym_dictionary (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(255) NOT NULL,
    status     VARCHAR(50)  NOT NULL DEFAULT 'PENDING_REVIEW',
    terms_json LONGTEXT     NOT NULL COMMENT 'JSON array of SynonymGroup',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evaluation_result (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    config_label VARCHAR(255)  NOT NULL,
    query_set_id VARCHAR(255),
    ndcg_at10    DOUBLE,
    precision_at5 DOUBLE,
    mrr          DOUBLE,
    query_count  INT,
    detail_json  LONGTEXT COMMENT 'JSON with per-query scores',
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_eval_config_label (config_label)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
