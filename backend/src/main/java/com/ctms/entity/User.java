package com.ctms.entity;

import com.ctms.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emp_id", unique = true, nullable = false)
    private String empId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(length = 100)
    private String passcode;

    @Column(name = "profile_pic_url")
    private String profilePicUrl;

    @Column(name = "date_of_joining")
    private String dateOfJoining;

    private String contact;

    @Column(name = "passport_number")
    private String passportNumber;

    @Column(name = "govt_id")
    private String govtId;

    private String department;

    private String designation;
}
