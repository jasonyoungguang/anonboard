package com.anonboard.family.dto.response;

import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.entity.FamilyStory;
import lombok.Data;

import java.util.List;

@Data
public class MemberDetailResp {
    private FamilyMember member;
    private List<FamilyRelationship> relationships;
    private List<FamilyStory> stories;
}
