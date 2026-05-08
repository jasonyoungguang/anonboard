package com.anonboard.family.dto.response;

import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import lombok.Data;

import java.util.List;

@Data
public class FamilyTreeResp {
    private List<FamilyMember> members;
    private List<FamilyRelationship> relationships;
}
