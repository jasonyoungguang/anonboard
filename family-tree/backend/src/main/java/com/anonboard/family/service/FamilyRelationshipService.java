package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.mapper.FamilyMemberMapper;
import com.anonboard.family.mapper.FamilyRelationshipMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FamilyRelationshipService {

    private final FamilyRelationshipMapper relationshipMapper;
    private final FamilyMemberMapper memberMapper;

    public FamilyRelationshipService(FamilyRelationshipMapper relationshipMapper,
                                     FamilyMemberMapper memberMapper) {
        this.relationshipMapper = relationshipMapper;
        this.memberMapper = memberMapper;
    }

    public List<FamilyRelationship> getAllRelationships() {
        return relationshipMapper.selectList(null);
    }

    /**
     * 获取活跃成员之间的关系（排除已删除成员）
     */
    public List<FamilyRelationship> getAllActiveRelationships() {
        Set<Long> activeMemberIds = memberMapper.selectList(
            new LambdaQueryWrapper<FamilyMember>().eq(FamilyMember::getIsDeleted, false)
        ).stream().map(FamilyMember::getId).collect(Collectors.toSet());

        return getAllRelationships().stream()
            .filter(r -> activeMemberIds.contains(r.getMemberAId())
                     && activeMemberIds.contains(r.getMemberBId()))
            .collect(Collectors.toList());
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
