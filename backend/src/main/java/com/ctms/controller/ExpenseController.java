package com.ctms.controller;

import com.ctms.dto.ExpenseDTO;
import com.ctms.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ExpenseDTO> uploadExpense(@Valid @RequestBody ExpenseDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.uploadExpense(dto));
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesByTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(expenseService.getExpensesByTrip(tripId));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<List<ExpenseDTO>> getPendingExpenses() {
        return ResponseEntity.ok(expenseService.getPendingExpenses());
    }

    @PutMapping("/{id}/credit")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ExpenseDTO> creditExpense(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.creditExpense(id));
    }
}
