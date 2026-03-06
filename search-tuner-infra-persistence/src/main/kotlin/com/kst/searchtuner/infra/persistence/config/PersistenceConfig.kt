package com.kst.searchtuner.infra.persistence.config

import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

@Configuration
@EnableJpaRepositories(basePackages = ["com.kst.searchtuner.infra.persistence.repository"])
@EntityScan(basePackages = ["com.kst.searchtuner.infra.persistence.entity"])
class PersistenceConfig
