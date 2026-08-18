package com.ctms.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripClosureCheckDTO {
    private Long tripId;
    private boolean datePassed;
    private String endDate;
    private boolean expensesCredited;
    private long pendingExpensesCount;
    private boolean assetsReturned;
    private String allocatedAssets;
    private boolean journeyEnded;
    private boolean canClose;
    private String closureBlockReason;
}
