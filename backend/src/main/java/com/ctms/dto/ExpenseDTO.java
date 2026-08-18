package com.ctms.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ExpenseDTO {

    private Long id;
    private Long tripId;

    private String fileUrl;
    private String fileName;

    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String description;
    private String status;
    private String createdAt;
    private String creditedAt;
}
