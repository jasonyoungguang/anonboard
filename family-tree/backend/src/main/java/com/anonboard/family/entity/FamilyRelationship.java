package com.anonboard.family.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("family_relationship")
public class FamilyRelationship {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("member_a_id")
    private Long memberAId;

    @TableField("member_b_id")
    private Long memberBId;

    @TableField("relation_type")
    private String relationType;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
