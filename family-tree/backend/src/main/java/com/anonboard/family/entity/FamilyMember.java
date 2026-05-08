package com.anonboard.family.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("family_member")
public class FamilyMember {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private Integer gender;

    @TableField("birth_year")
    private Integer birthYear;

    @TableField("death_year")
    private Integer deathYear;

    private Integer generation;

    @TableField("avatar_url")
    private String avatarUrl;

    private String bio;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
