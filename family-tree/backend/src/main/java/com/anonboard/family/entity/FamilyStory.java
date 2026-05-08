package com.anonboard.family.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("family_story")
public class FamilyStory {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("member_id")
    private Long memberId;

    private String title;

    private String content;

    @TableField("story_year")
    private Integer storyYear;

    @TableField("story_month")
    private Integer storyMonth;

    private String category;

    private Integer status;

    @TableField("submitter_name")
    private String submitterName;

    @TableField("reviewer_id")
    private Long reviewerId;

    @TableField("review_comment")
    private String reviewComment;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField("reviewed_at")
    private LocalDateTime reviewedAt;
}
