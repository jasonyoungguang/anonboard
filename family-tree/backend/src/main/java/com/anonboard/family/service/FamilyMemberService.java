package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.mapper.FamilyMemberMapper;
import com.anonboard.family.mapper.FamilyRelationshipMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FamilyMemberService {

    private final FamilyMemberMapper memberMapper;
    private final FamilyRelationshipMapper relationshipMapper;

    public FamilyMemberService(FamilyMemberMapper memberMapper, FamilyRelationshipMapper relationshipMapper) {
        this.memberMapper = memberMapper;
        this.relationshipMapper = relationshipMapper;
    }

    public List<FamilyMember> getAllMembers() {
        return memberMapper.selectList(null);
    }

    public FamilyMember getById(Long id) {
        return memberMapper.selectById(id);
    }

    public boolean addMember(FamilyMember member) {
        return memberMapper.insert(member) > 0;
    }

    public boolean updateMember(FamilyMember member) {
        return memberMapper.updateById(member) > 0;
    }

    public boolean deleteMember(Long id) {
        return memberMapper.deleteById(id) > 0;
    }

    public List<FamilyMember> getMembersByGeneration(int generation) {
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getGeneration, generation);
        return memberMapper.selectList(wrapper);
    }

    @Transactional
    public boolean addRelative(Long existingId, FamilyMember newMember, boolean isParent) {
        memberMapper.insert(newMember);

        FamilyRelationship rel = new FamilyRelationship();
        if (isParent) {
            rel.setMemberAId(newMember.getId());
            rel.setMemberBId(existingId);
        } else {
            rel.setMemberAId(existingId);
            rel.setMemberBId(newMember.getId());
        }
        rel.setRelationType("parent-child");
        return relationshipMapper.insert(rel) > 0;
    }
}
