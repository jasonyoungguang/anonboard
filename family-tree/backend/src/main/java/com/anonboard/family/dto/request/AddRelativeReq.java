package com.anonboard.family.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddRelativeReq {

    @NotBlank(message = "关系类型不能为空")
    private String relationType;

    @NotBlank(message = "姓名不能为空")
    private String name;

    private Integer birthYear;

    private Integer deathYear;
}
