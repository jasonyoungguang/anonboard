package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.mapper.FamilyRelationshipMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FamilyRelationshipService {

    private final FamilyRelationshipMapper relationshipMapper;

    public FamilyRelationshipService(FamilyRelationshipMapper relationshipMapper) {
        this.relationshipMapper = relationshipMapper;
    }

    public List<FamilyRelationship> getAllRelationships() {
        return relationshipMapper.selectList(null);
    }

    public List<FamilyRelationship> getRelationsByMember(Long memberId) {
        LambdaQueryWrapper<FamilyRelationship> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyRelationship::getMemberAId, memberId)
                .or().eq(FamilyRelationship::getMemberBId, memberId);
        return relationshipMapper.selectList(wrapper);
    }

    public boolean addRelationship(FamilyRelationship relationship) {
        return relationshipMapper.insert(relationship) > 0;
    }

    public boolean deleteRelationship(Long id) {
        return relationshipMapper.deleteById(id) > 0;
    }
}
