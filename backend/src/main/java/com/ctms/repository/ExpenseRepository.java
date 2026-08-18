package com.ctms.repository;

import com.ctms.entity.Expense;
import com.ctms.entity.enums.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByTripRequestId(Long tripRequestId);

    List<Expense> findByStatus(ExpenseStatus status);

    long countByTripRequestIdAndStatusNot(Long tripRequestId, ExpenseStatus status);

    boolean existsByTripRequestIdAndStatusNot(Long tripRequestId, ExpenseStatus status);
}
