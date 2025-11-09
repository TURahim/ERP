package com.invoiceme.erp.dto;

import lombok.Data;

import java.util.List;

@Data
public class ApiResponse<T> {
    private List<T> data;
    private Pagination pagination;

    @Data
    public static class Pagination {
        private int page;
        private int size;
        private long total;
        private int totalPages;
    }
}

