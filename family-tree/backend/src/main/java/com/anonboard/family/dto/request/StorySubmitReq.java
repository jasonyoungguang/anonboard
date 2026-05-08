package com.anonboard.family.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StorySubmitReq {
    @NotNull(message = "人物ID不能为空")
    private Long memberId;

    @NotBlank(message = "事迹标题不能为空")
    private String title;

    private String content;

    private Integer storyYear;

    private Integer storyMonth;

    private String category;

    @NotBlank(message = "提交人姓名不能为空")
    private String submitterName;
}
