package com.anonboard.family.dto.response;

import lombok.Data;

@Data
public class StatsResp {
    private long totalMembers;
    private long maleCount;
    private long femaleCount;
    private long unknownGenderCount;
    private Integer minGeneration;
    private Integer maxGeneration;
}
