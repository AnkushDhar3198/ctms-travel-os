package com.ctms.repository;

import com.ctms.entity.User;
import com.ctms.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmpId(String empId);

    Optional<User> findByRoleAndPasscode(UserRole role, String passcode);

    boolean existsByEmpId(String empId);
}
