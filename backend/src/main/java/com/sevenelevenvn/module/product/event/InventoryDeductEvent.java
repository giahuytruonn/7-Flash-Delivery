package com.sevenelevenvn.module.product.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDeductEvent {
    private UUID orderId;
    private List<DeductItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeductItem {
        private UUID productId;
        private Integer quantity;
    }
}
