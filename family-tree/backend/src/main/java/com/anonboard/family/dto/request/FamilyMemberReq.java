package com.anonboard.family.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FamilyMemberReq {
    @NotBlank(message = "姓名不能为空")
    private String name;

    private Integer gender;

    private Integer birthYear;

    private Integer deathYear;

    private Integer generation;

    private String avatarUrl;

    private String bio;
}
